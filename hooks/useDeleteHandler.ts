"use client";

import { useState } from "react";
import { toast } from "sonner";
import { log } from "@/lib/logger";

/**
 * Options for the delete handler hook
 * @template TData - The type of data returned from the delete operation (defaults to void)
 */
export interface UseDeleteHandlerOptions<TData = void> {
  /**
   * The delete function to execute. Should return a promise.
   * @param id - The ID of the resource to delete
   */
  deleteFunction: (id: string) => Promise<TData>;

  /**
   * The name of the resource being deleted (for user-facing messages)
   * @default "item"
   * @example "topic", "knowledge item", "workspace"
   */
  resourceName?: string;

  /**
   * Callback executed after successful deletion
   * @param data - The data returned from the delete operation
   */
  onSuccess?: (data: TData) => void | Promise<void>;

  /**
   * Callback executed when deletion fails
   * @param error - The error that occurred
   */
  onError?: (error: Error) => void;

  /**
   * Custom success message to show in toast
   * If not provided, defaults to "{resourceName} deleted successfully"
   */
  successMessage?: string;

  /**
   * Custom error message to show in toast
   * If not provided, defaults to "Failed to delete {resourceName}"
   */
  errorMessage?: string;
}

/**
 * Return value from the delete handler hook
 * @template TData - The type of data returned from the delete operation
 */
export interface UseDeleteHandlerReturn<TData = void> {
  /**
   * Execute the delete operation
   * @param id - The ID of the resource to delete
   * @returns Promise that resolves when deletion is complete
   */
  handleDelete: (id: string) => Promise<void>;

  /**
   * Whether a deletion is currently in progress
   */
  isDeleting: boolean;

  /**
   * The last error that occurred, if any
   */
  error: Error | null;

  /**
   * Clear the error state
   */
  clearError: () => void;
}

/**
 * Generic hook for handling delete operations with consistent UX patterns
 *
 * Provides:
 * - Loading state management
 * - Automatic toast notifications
 * - Error handling
 * - Customizable success/error callbacks
 *
 * @template TData - The type of data returned from the delete operation (defaults to void)
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { handleDelete, isDeleting } = useDeleteHandler({
 *   deleteFunction: (id) => webKnowledgeService.delete(workspaceId, id),
 *   resourceName: "web knowledge",
 * });
 *
 * // With callbacks
 * const { handleDelete, isDeleting } = useDeleteHandler({
 *   deleteFunction: topicService.delete,
 *   resourceName: "topic",
 *   onSuccess: () => {
 *     router.push('/topics');
 *   },
 * });
 *
 * // Custom messages
 * const { handleDelete, isDeleting } = useDeleteHandler({
 *   deleteFunction: deleteItem,
 *   successMessage: "Item removed from your library",
 *   errorMessage: "Couldn't remove item. Please try again.",
 * });
 * ```
 */
export function useDeleteHandler<TData = void>(
  options: UseDeleteHandlerOptions<TData>
): UseDeleteHandlerReturn<TData> {
  const {
    deleteFunction,
    resourceName = "item",
    onSuccess,
    onError,
    successMessage,
    errorMessage,
  } = options;

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDelete = async (id: string): Promise<void> => {
    try {
      setIsDeleting(true);
      setError(null);

      log.info(`Deleting ${resourceName}`, { id, resourceName });

      const result = await deleteFunction(id);

      log.info(`${resourceName} deleted successfully`, {
        id,
        resourceName,
      });

      // Execute onSuccess callback if provided
      if (onSuccess) {
        await onSuccess(result);
      }

      // Show success toast
      const message = successMessage || `${resourceName} deleted successfully`;
      toast.success(message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      log.error(`Failed to delete ${resourceName}`, {
        id,
        resourceName,
        error: error.message,
        stack: error.stack,
      });

      // Execute onError callback if provided
      if (onError) {
        onError(error);
      }

      // Show error toast
      const message =
        errorMessage || `Failed to delete ${resourceName}: ${error.message}`;
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    handleDelete,
    isDeleting,
    error,
    clearError,
  };
}
