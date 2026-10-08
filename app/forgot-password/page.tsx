import type { Metadata } from "next";
import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </GuestGuard>
  );
}
