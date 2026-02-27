import { redirect } from "next/navigation";

export default async function LegacyAcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; invitation_token?: string }>;
}) {
  const { token, invitation_token } = await searchParams;
  const targetToken = token || invitation_token;

  if (targetToken) {
    redirect(`/invitations/accept?token=${encodeURIComponent(targetToken)}`);
  }

  redirect("/invitations/accept");
}
