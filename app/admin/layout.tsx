import { AdminGate } from "@/components/admin/admin-gate";
import { ShellLayout } from "@/components/shell/shell-layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellLayout>
      <AdminGate>{children}</AdminGate>
    </ShellLayout>
  );
}
