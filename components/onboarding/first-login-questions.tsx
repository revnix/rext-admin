"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FieldController } from "@/components/forms/field-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { log } from "@/lib/logger";
import {
  GOAL_OPTIONS,
  HEARD_FROM_OPTIONS,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
} from "@/lib/onboarding/first-login-questions";
import { onboardingQueries } from "@/lib/query-keys";
import {
  type FirstLoginQuestions as Answers,
  firstLoginQuestionsSchema,
} from "@/schemas/onboarding-schemas";

const QUESTIONS = [
  { name: "user_industry", label: "Your industry", options: INDUSTRY_OPTIONS },
  { name: "user_role", label: "Your role", options: ROLE_OPTIONS },
  { name: "user_goal", label: "Your main goal", options: GOAL_OPTIONS },
  {
    name: "heard_from",
    label: "How you heard about Rext",
    options: HEARD_FROM_OPTIONS,
  },
] as const;

/**
 * The questions asked once at first login (plans/app/D-pages.md §2.9): industry, role, goal and how
 * the user heard of Rext, each optional, the whole skippable. The backend decides whom to ask (an
 * organic sign-up who hasn't finished onboarding; never an invited user or an admin). Answering
 * and skipping both end onboarding, so the questions don't come back.
 */
export function FirstLoginQuestions() {
  const queryClient = useQueryClient();
  const { data } = useQuery(onboardingQueries.shouldShow());
  const [dismissed, setDismissed] = useState(false);
  const form = useZodForm(firstLoginQuestionsSchema, { defaultValues: {} });

  const finish = useMutation({
    mutationFn: async (answers: Answers | null) => {
      if (answers && Object.values(answers).some(Boolean)) {
        await apiClient.onboarding.saveAnswers(answers);
      }
      await apiClient.onboarding.complete();
    },
    onError: (error) => {
      // Not worth stopping the user for: the questions come back at the next login.
      log.error("[Onboarding] Couldn't save the first-login answers", error);
    },
    onSettled: () => {
      queryClient.setQueryData(onboardingQueries.shouldShow().queryKey, {
        should_show: false,
      });
    },
  });

  const open = Boolean(data?.should_show) && !dismissed;
  const close = (answers: Answers | null) => {
    setDismissed(true);
    finish.mutate(answers);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>A few questions before you start</DialogTitle>
          <DialogDescription>
            They help us shape Rext for people like you. Answer any of them, or
            skip.
          </DialogDescription>
        </DialogHeader>
        <form
          id="first-login-questions"
          onSubmit={form.handleSubmit((answers) => close(answers))}
          noValidate
        >
          <FieldGroup>
            {QUESTIONS.map((question) => (
              <FieldController
                key={question.name}
                control={form.control}
                name={question.name}
                label={question.label}
              >
                {(field) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id={field.id}
                      aria-invalid={field["aria-invalid"]}
                      aria-describedby={field["aria-describedby"]}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    >
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FieldController>
            ))}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => close(null)}
            disabled={finish.isPending}
          >
            Skip
          </Button>
          <Button
            type="submit"
            form="first-login-questions"
            disabled={finish.isPending}
          >
            {finish.isPending && <Loader2 className="size-4 animate-spin" />}
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
