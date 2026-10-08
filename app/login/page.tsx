import type { Metadata } from "next";
import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </GuestGuard>
  );
}
