import { ShellLayout } from "@/components/shell/shell-layout";

// Each legal page renders its own DetailPage, titled with the document's name.
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShellLayout>{children}</ShellLayout>;
}
