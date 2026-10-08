import { auth } from "@/auth";
import { SignedOutFrame } from "@/components/legal/signed-out-frame";
import { ShellLayout } from "@/components/shell/shell-layout";

// Each legal page renders its own DetailPage, titled with the document's name. A reader with an
// account gets the shell around it; one without gets the document and the two ways in: these
// pages say what the app does with a visitor's data, so they open before sign-in (task 936).
export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.error) {
    return <SignedOutFrame>{children}</SignedOutFrame>;
  }
  return <ShellLayout>{children}</ShellLayout>;
}
