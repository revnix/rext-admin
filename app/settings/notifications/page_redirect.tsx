import { redirect } from "next/navigation";

/**
 * Notifications Page - Redirect
 *
 * Notification preferences have been moved to Account > Notifications tab.
 * This page redirects to /settings/account for better organization.
 */
export default function NotificationsPage() {
  redirect("/settings/account");
}
