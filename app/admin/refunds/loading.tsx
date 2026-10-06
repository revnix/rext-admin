import { PageSkeleton } from "@/components/layouts";

/**
 * Admin refunds page loading state
 */
export default function Loading() {
  return <PageSkeleton stats={3} />;
}
