import { z } from "zod";
import {
  GOAL_OPTIONS,
  HEARD_FROM_OPTIONS,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
} from "@/lib/onboarding/first-login-questions";

const oneOf = <T extends readonly { value: string }[]>(options: T) =>
  z.enum(options.map((option) => option.value) as [string, ...string[]]);

/** The first-login questions: every one optional, so any answer can be left out. */
export const firstLoginQuestionsSchema = z.object({
  user_industry: oneOf(INDUSTRY_OPTIONS).optional(),
  user_role: oneOf(ROLE_OPTIONS).optional(),
  user_goal: oneOf(GOAL_OPTIONS).optional(),
  heard_from: oneOf(HEARD_FROM_OPTIONS).optional(),
});

export type FirstLoginQuestions = z.infer<typeof firstLoginQuestionsSchema>;
