"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import type {
  OnboardingMarketingData,
  OnboardingStatus,
  OnboardingStepUpdate,
} from "@/types/onboarding";

export function useOnboarding(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const { status: sessionStatus } = useSession();
  const featureEnabled = options?.enabled ?? true;

  // Only fetch onboarding data when user is authenticated and feature is enabled
  const isAuthenticated = sessionStatus === "authenticated" && featureEnabled;

  // Fetch onboarding status
  const {
    data: status,
    isLoading,
    error,
  } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding", "status"],
    queryFn: () => apiClient.onboarding.getStatus(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Never retry - fail fast on errors
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Check if should show onboarding
  const { data: shouldShowData } = useQuery<{ should_show: boolean }>({
    queryKey: ["onboarding", "should-show"],
    queryFn: () => apiClient.onboarding.shouldShow(),
    staleTime: 1000 * 60 * 5,
    retry: false, // Never retry - fail fast on errors
    refetchOnMount: false, // Don't refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  // Update step mutation
  const updateStepMutation = useMutation({
    mutationFn: (data: OnboardingStepUpdate) =>
      apiClient.onboarding.updateStep(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["onboarding", "status"], data);
      queryClient.invalidateQueries({
        queryKey: ["onboarding", "should-show"],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update onboarding step");
    },
  });

  // Complete onboarding mutation
  const completeMutation = useMutation({
    mutationFn: () => apiClient.onboarding.complete(),
    onSuccess: (data) => {
      queryClient.setQueryData(["onboarding", "status"], data);
      queryClient.invalidateQueries({
        queryKey: ["onboarding", "should-show"],
      });
      toast.success("Welcome to REXT! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });

  // Reset onboarding mutation
  const resetMutation = useMutation({
    mutationFn: () => apiClient.onboarding.reset({ confirm: true }),
    onSuccess: (data) => {
      queryClient.setQueryData(["onboarding", "status"], data);
      queryClient.invalidateQueries({
        queryKey: ["onboarding", "should-show"],
      });
      toast.success("Onboarding reset successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset onboarding");
    },
  });

  // Update marketing data mutation
  const updateMarketingMutation = useMutation({
    mutationFn: (data: OnboardingMarketingData) =>
      apiClient.onboarding.updateMarketingData(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["onboarding", "status"], data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save your information");
    },
  });

  return {
    // Status
    status,
    isLoading,
    error,
    shouldShow: shouldShowData?.should_show ?? false,

    // Computed values
    isCompleted: status?.completed ?? false,
    currentStep: status?.current_step ?? 0,
    completedSteps: status?.completed_steps ?? [],
    skippedSteps: status?.skipped_steps ?? [],

    // Actions
    completeStep: async (step: number) => {
      await updateStepMutation.mutateAsync({ step, action: "complete" });
    },

    skipStep: async (step: number) => {
      await updateStepMutation.mutateAsync({ step, action: "skip" });
    },

    goToStep: async (step: number) => {
      await updateStepMutation.mutateAsync({ step, action: "set_current" });
    },

    complete: async () => {
      await completeMutation.mutateAsync();
    },

    reset: async () => {
      await resetMutation.mutateAsync();
    },

    updateMarketingData: async (data: OnboardingMarketingData) => {
      await updateMarketingMutation.mutateAsync(data);
    },

    // Loading states
    isUpdating: updateStepMutation.isPending,
    isCompleting: completeMutation.isPending,
    isResetting: resetMutation.isPending,
    isUpdatingMarketing: updateMarketingMutation.isPending,
  };
}
