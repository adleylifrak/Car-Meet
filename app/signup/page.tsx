import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";

// Sign up and log in are the same OTP flow — Supabase creates the account on
// first verification, so there's nothing extra to do for a new user here.
export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen />
    </Suspense>
  );
}
