import { PageLayout } from "@/components/page-layout";
import { ShellLayout } from "@/components/shell/shell-layout";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <PageLayout
        title="Legal"
        description="Terms, policies, and legal information"
      >
        <div className="max-w-4xl mx-auto">{children}</div>
      </PageLayout>
    </ShellLayout>
  );
}
