/**
 * useOptimisticMutation - Optimistic Update Hook
 *
 * Provides optimistic updates with automatic rollback on error:
 * - Updates UI immediately for better UX
 * - Rolls back on error
 * - Toast notifications
 * - Query invalidation on success
 *
 * @example
 * ```tsx
 * const updateTopic = useOptimisticMutation({
 *   mutationFn: (updated) => topicService.update(updated.id, updated),
 *   queryKey: ['topics', workspaceId],
 *   optimisticUpdater: (oldTopics, updated) =>
 *     oldTopics.map(t => t.id === updated.id ? { ...t, ...updated } : t),
 *   successMessage: "Topic updated!",
 * });
 *
 * // Usage
 * updateTopic.mutate({ id: "123", title: "New Title" });
 * ```
 */

import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface UseOptimisticMutationOptions<
  TData,
  TVariables,
  TCachedData = unknown,
  TError = Error,
> {
  /**
   * The mutation function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Query key for the data to update optimistically
   */
  queryKey: QueryKey;

  /**
   * Function to compute optimistic data from old data and variables
   */
  optimisticUpdater: (
    oldData: TCachedData,
    variables: TVariables,
  ) => TCachedData;

  /**
   * Success message to display
   */
  successMessage?: string | ((data: TData) => string);

  /**
   * Error message to display
   */
  errorMessage?: string | ((error: TError) => string);

  /**
   * Additional success callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /**
   * Additional error callback
   */
  onError?: (
    error: TError,
    variables: TVariables,
    context?: { previousData: TCachedData },
  ) => void | Promise<void>;

  /**
   * Custom mutation key (optional)
   */
  mutationKey?: QueryKey;
}

const log = logger.forComponent("useOptimisticMutation");

/**
 * Hook for mutations with optimistic updates and automatic rollback
 */
export function useOptimisticMutation<
  TData = unknown,
  TVariables = void,
  TCachedData = unknown,
  TError = Error,
>({
  mutationFn,
  queryKey,
  optimisticUpdater,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  mutationKey: customMutationKey,
}: UseOptimisticMutationOptions<TData, TVariables, TCachedData, TError>) {
  const queryClient = useQueryClient();

  return useMutation<
    TData,
    TError,
    TVariables,
    { previousData: TCachedData | undefined }
  >({
    mutationKey: customMutationKey,
    mutationFn,

    onMutate: async (variables) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TCachedData>(queryKey);

      // Optimistically update the cache
      if (previousData) {
        const optimisticData = optimisticUpdater(previousData, variables);
        queryClient.setQueryData(queryKey, optimisticData);

        log.debug("Applied optimistic update", {
          queryKey,
          mutationKey: customMutationKey,
        });
      }

      // Return context with snapshot
      return { previousData };
    },

    onSuccess: async (data, variables, _context) => {
      // Show success toast
      if (successMessage) {
        const message =
          typeof successMessage === "function"
            ? successMessage(data)
            : successMessage;
        toast.success(message);
      }

      // Invalidate and refetch to ensure server data is correct
      await queryClient.invalidateQueries({ queryKey });

      // Call custom success callback
      if (onSuccess) {
        await onSuccess(data, variables);
      }

      log.debug("Optimistic mutation succeeded", {
        queryKey,
        mutationKey: customMutationKey,
      });
    },

    onError: async (error, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);

        log.debug("Rolled back optimistic update", {
          queryKey,
          mutationKey: customMutationKey,
        });
      }

      // Show error toast
      const message = errorMessage
        ? typeof errorMessage === "function"
          ? errorMessage(error)
          : errorMessage
        : error instanceof Error
          ? error.message
          : "An error occurred";

      toast.error(message);

      // Call custom error callback
      if (onError) {
        await onError(
          error,
          variables,
          context as { previousData: TCachedData },
        );
      }

      log.error("Optimistic mutation failed", {
        queryKey,
        mutationKey: customMutationKey,
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

/**
 * Type-safe optimistic mutation result
 */
export type OptimisticMutationResult<
  TData,
  TVariables,
  TCachedData,
  TError = Error,
> = ReturnType<
  typeof useOptimisticMutation<TData, TVariables, TCachedData, TError>
>;
