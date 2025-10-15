import { redirect } from "next/navigation";

/**
 * Settings Index Page
 *
 * Redirects to the general settings page.
 * This ensures /settings doesn't 404.
 */
export default function SettingsPage() {
  redirect("/settings/general");
}
