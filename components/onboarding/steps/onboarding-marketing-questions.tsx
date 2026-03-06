"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  GOAL_OPTIONS,
  GoalValue,
  HEARD_FROM_OPTIONS,
  HeardFromValue,
  INDUSTRY_OPTIONS,
  IndustryValue,
  ROLE_OPTIONS,
  RoleValue,
} from "@/types/onboarding";

interface OnboardingMarketingQuestionsProps {
  onNext: () => void;
  isLoading: boolean;
}

type QuestionType = "industry" | "role" | "goal" | "heard_from";

interface Question {
  id: QuestionType;
  title: string;
  options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly description?: string;
    readonly icon: string;
  }>;
}

const QUESTIONS: Question[] = [
  {
    id: "industry",
    title: "What industry are you in?",
    options: INDUSTRY_OPTIONS,
  },
  {
    id: "role",
    title: "What's your role?",
    options: ROLE_OPTIONS,
  },
  {
    id: "goal",
    title: "What's your main goal?",
    options: GOAL_OPTIONS,
  },
  {
    id: "heard_from",
    title: "How did you hear about us?",
    options: HEARD_FROM_OPTIONS,
  },
];

export function OnboardingMarketingQuestions({
  onNext,
  isLoading,
}: OnboardingMarketingQuestionsProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{
    industry: IndustryValue | "";
    role: RoleValue | "";
    goal: GoalValue | "";
    heard_from: HeardFromValue | "";
  }>({
    industry: "",
    role: "",
    goal: "",
    heard_from: "",
  });
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const { updateMarketingData, isUpdatingMarketing } = useOnboarding();

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUESTIONS.length - 1;

  const handleSelectOption = async (value: string) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: value,
    };
    setAnswers(newAnswers);

    // Save to backend immediately
    await updateMarketingData({
      user_industry: newAnswers.industry || null,
      user_role: newAnswers.role || null,
      user_goal: newAnswers.goal || null,
      heard_from: newAnswers.heard_from || null,
    });

    // Auto-advance to next question or complete
    setTimeout(() => {
      if (isLastQuestion) {
        onNext();
      } else {
        setDirection("forward");
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 300);
  };

  const handleSkip = async () => {
    if (isLastQuestion) {
      // Save whatever we have and move on
      await updateMarketingData({
        user_industry: answers.industry || null,
        user_role: answers.role || null,
        user_goal: answers.goal || null,
        heard_from: answers.heard_from || null,
      });
      onNext();
    } else {
      setDirection("forward");
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setDirection("backward");
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const variants = {
    enter: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "forward" | "backward") => ({
      x: direction === "forward" ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-1">{currentQuestion.title}</h2>
        <p className="text-sm text-muted-foreground">
          {currentQuestionIndex + 1} of {QUESTIONS.length}
        </p>
      </div>

      {/* Question content with animation */}
      <div className="max-w-2xl mx-auto min-h-[320px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestionIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="grid grid-cols-2 gap-3"
          >
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;

              return (
                <Card
                  key={option.value}
                  className={`border-2 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border"
                  }`}
                  onClick={() => handleSelectOption(option.value)}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-2 p-4 min-h-[100px]">
                    <div className="text-3xl">{option.icon}</div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{option.label}</p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="rounded-full bg-primary p-1">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center max-w-2xl mx-auto pt-4 gap-2">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0 || isUpdatingMarketing}
          size="sm"
        >
          Back
        </Button>

        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={isLoading || isUpdatingMarketing}
          size="sm"
        >
          {isLastQuestion ? "Finish" : "Skip"}
        </Button>
      </div>
    </div>
  );
}
