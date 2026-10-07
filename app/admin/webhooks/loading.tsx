import { PageSkeleton } from "@/components/layouts";

/**
 * Admin webhooks page loading state
 */
export default function Loading() {
  return <PageSkeleton stats={4} />;
}
