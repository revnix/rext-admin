import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </GuestGuard>
  );
}
