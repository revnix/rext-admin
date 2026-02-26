import { PageLayout } from "@/components/page-layout";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Legal"
      description="Terms, policies, and legal information"
    >
      <div className="max-w-4xl mx-auto">{children}</div>
    </PageLayout>
  );
}
