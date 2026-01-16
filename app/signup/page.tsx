import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/signup-form";

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <SignupForm />
      </AuthLayout>
    </GuestGuard>
  );
}
