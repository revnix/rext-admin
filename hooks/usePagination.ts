/**
 * usePagination Hook
 *
 * A reusable hook for managing pagination state and navigation.
 * Handles page calculations and boundary checks.
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   totalPages,
 *   nextPage,
 *   prevPage,
 *   setPage,
 *   canGoNext,
 *   canGoPrev,
 *   pageSize,
 *   startIndex,
 *   endIndex
 * } = usePagination({
 *   totalItems: 100,
 *   itemsPerPage: 10,
 *   initialPage: 1
 * });
 *
 * const paginatedData = data.slice(startIndex, endIndex);
 * ```
 */

import { useCallback, useMemo, useState } from "react";

export interface PaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
}

export interface PaginationResult {
  // Current state
  currentPage: number;
  totalPages: number;
  pageSize: number;

  // Derived values
  startIndex: number;
  endIndex: number;
  isFirstPage: boolean;
  isLastPage: boolean;

  // Navigation
  canGoNext: boolean;
  canGoPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;

  // Helpers
  getPageNumbers: () => number[];
  isPageActive: (page: number) => boolean;
}

/**
 * Hook for managing pagination state
 */
export function usePagination(options: PaginationOptions): PaginationResult {
  const { totalItems, itemsPerPage, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  // Ensure current page is within valid range
  const validCurrentPage = useMemo(() => {
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  // Calculate start and end indices for slicing
  const startIndex = useMemo(() => {
    return (validCurrentPage - 1) * itemsPerPage;
  }, [validCurrentPage, itemsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + itemsPerPage, totalItems);
  }, [startIndex, itemsPerPage, totalItems]);

  // Navigation checks
  const canGoNext = useMemo(() => {
    return validCurrentPage < totalPages;
  }, [validCurrentPage, totalPages]);

  const canGoPrev = useMemo(() => {
    return validCurrentPage > 1;
  }, [validCurrentPage]);

  const isFirstPage = useMemo(() => {
    return validCurrentPage === 1;
  }, [validCurrentPage]);

  const isLastPage = useMemo(() => {
    return validCurrentPage === totalPages;
  }, [validCurrentPage, totalPages]);

  // Navigation functions
  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(validPage);
    },
    [totalPages]
  );

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Helper to get array of page numbers for pagination UI
  const getPageNumbers = useCallback((): number[] => {
    const pages: number[] = [];
    const maxPagesToShow = 7; // Show at most 7 page numbers
    const sidePages = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with surrounding pages
      let startPage = Math.max(1, validCurrentPage - sidePages);
      let endPage = Math.min(totalPages, validCurrentPage + sidePages);

      // Adjust if we're near the beginning
      if (validCurrentPage <= sidePages) {
        endPage = maxPagesToShow;
      }

      // Adjust if we're near the end
      if (validCurrentPage >= totalPages - sidePages) {
        startPage = totalPages - maxPagesToShow + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }, [totalPages, validCurrentPage]);

  // Helper to check if a page is active
  const isPageActive = useCallback(
    (page: number): boolean => {
      return page === validCurrentPage;
    },
    [validCurrentPage]
  );

  return {
    currentPage: validCurrentPage,
    totalPages,
    pageSize: itemsPerPage,
    startIndex,
    endIndex,
    isFirstPage,
    isLastPage,
    canGoNext,
    canGoPrev,
    nextPage,
    prevPage,
    setPage,
    goToFirstPage,
    goToLastPage,
    getPageNumbers,
    isPageActive,
  };
}
