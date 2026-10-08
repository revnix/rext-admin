import type { Metadata } from "next";
import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/signup-form";

export const metadata: Metadata = { title: "Sign up" };

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <SignupForm />
      </AuthLayout>
    </GuestGuard>
  );
}
