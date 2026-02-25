import { redirect } from "next/navigation";

/**
 * Sessions Page - Redirect
 *
 * Sessions management has been moved to Security page.
 * This page redirects to /settings/security for better organization.
 */
export default function SessionsPage() {
  redirect("/settings/security");
}
