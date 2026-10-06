import { DetailPage } from "@/components/layouts";
import { ShellLayout } from "@/components/shell/shell-layout";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <DetailPage
        title="Legal"
        description="Terms, policies, and legal information"
      >
        <div className="max-w-4xl mx-auto">{children}</div>
      </DetailPage>
    </ShellLayout>
  );
}
