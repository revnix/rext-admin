import { GuestGuard } from "@/components/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <GuestGuard>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </GuestGuard>
  );
}
