/**
 * useMutationWithToast - Reusable React Query Mutation Hook
 *
 * Provides centralized mutation handling with:
 * - Toast notifications for success/error
 * - Automatic query invalidation
 * - Consistent error handling
 * - Loading states
 *
 * @example
 * ```tsx
 * const createWorkspace = useMutationWithToast({
 *   mutationFn: (data) => workspaceService.createWorkspace(data),
 *   successMessage: "Workspace created successfully!",
 *   invalidateQueries: [['workspaces']],
 *   onSuccess: (data) => router.push(`/workspaces/${data.workspace.id}`)
 * });
 *
 * // Usage
 * createWorkspace.mutate({ title: "New Workspace", url: "..." });
 * ```
 */

import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

export interface UseMutationWithToastOptions<
  TData,
  TVariables,
  TError = Error,
> {
  /**
   * The mutation function to execute
   */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Success message to display (optional, can be string or function)
   */
  successMessage?: string | ((data: TData) => string);

  /**
   * Error message to display (optional, can be string or function)
   */
  errorMessage?: string | ((error: TError) => string);

  /**
   * Query keys to invalidate on success
   */
  invalidateQueries?: QueryKey[];

  /**
   * Additional success callback
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;

  /**
   * Additional error callback
   */
  onError?: (error: TError, variables: TVariables) => void | Promise<void>;

  /**
   * Additional settled callback (called on both success and error)
   */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
  ) => void | Promise<void>;

  /**
   * Custom mutation key (optional)
   */
  mutationKey?: QueryKey;

  /**
   * Whether to show loading toast (default: false)
   */
  showLoadingToast?: boolean;

  /**
   * Loading toast message (only used if showLoadingToast is true)
   */
  loadingMessage?: string;
}

const log = logger.forComponent("useMutationWithToast");

/**
 * Hook for mutations with automatic toast notifications and query invalidation
 */
export function useMutationWithToast<
  TData = unknown,
  TVariables = void,
  TError = Error,
>({
  mutationFn,
  successMessage,
  errorMessage,
  invalidateQueries = [],
  onSuccess,
  onError,
  onSettled,
  mutationKey,
  showLoadingToast = false,
  loadingMessage = "Processing...",
}: UseMutationWithToastOptions<TData, TVariables, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationKey,
    mutationFn,

    onMutate: async (variables) => {
      if (showLoadingToast) {
        toast.loading(loadingMessage);
      }

      log.debug("Mutation started", {
        mutationKey,
        variables:
          typeof variables === "object"
            ? Object.keys(variables as object)
            : undefined,
      });
    },

    onSuccess: async (data, variables) => {
      // Dismiss loading toast
      if (showLoadingToast) {
        toast.dismiss();
      }

      // Show success toast
      if (successMessage) {
        const message =
          typeof successMessage === "function"
            ? successMessage(data)
            : successMessage;
        toast.success(message);
      }

      // Invalidate queries
      if (invalidateQueries.length > 0) {
        await Promise.all(
          invalidateQueries.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );

        log.debug("Invalidated queries", {
          queryKeys: invalidateQueries,
        });
      }

      // Call custom success callback
      if (onSuccess) {
        await onSuccess(data, variables);
      }

      log.debug("Mutation succeeded", {
        mutationKey,
      });
    },

    onError: async (error, variables) => {
      // Dismiss loading toast
      if (showLoadingToast) {
        toast.dismiss();
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
        await onError(error, variables);
      }

      log.error("Mutation failed", {
        mutationKey,
        error: error instanceof Error ? error.message : String(error),
      });
    },

    onSettled: async (data, error, variables) => {
      // Dismiss loading toast if still present
      if (showLoadingToast) {
        toast.dismiss();
      }

      // Call custom settled callback
      if (onSettled) {
        await onSettled(data, error, variables);
      }

      log.debug("Mutation settled", {
        mutationKey,
        success: !error,
      });
    },
  });
}

/**
 * Type-safe mutation result
 */
export type MutationWithToastResult<
  TData,
  TVariables,
  TError = Error,
> = ReturnType<typeof useMutationWithToast<TData, TVariables, TError>>;
