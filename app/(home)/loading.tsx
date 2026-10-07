import { PageSkeleton } from "@/components/layouts";

/**
 * Home's loading state, inside the shell: after login the shell and the page's shape show at once,
 * not the root's bare spinner (C11 #554).
 */
export default function HomeLoading() {
  return <PageSkeleton layout="detail" />;
}
