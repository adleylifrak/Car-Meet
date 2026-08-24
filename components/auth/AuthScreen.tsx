"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { hasSupabaseConfig } from "@/lib/supabase/client";

type Method = "email" | "phone";
type Step = "identify" | "code";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/map";

  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("identify");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!hasSupabaseConfig) {
      // Demo mode — no backend configured yet, mock "you" is already signed in.
      router.push(next);
      return;
    }
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp(
        method === "email" ? { email: value } : { phone: value }
      );
      if (error) throw error;
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send a code.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp(
        method === "email"
          ? { email: value, token: code, type: "email" }
          : { phone: value, token: code, type: "sms" }
      );
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user?.id)
        .maybeSingle();

      router.push(profile ? next : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">CarMeet</h1>
        <p className="mb-8 text-sm text-muted">Find and organize local car meets.</p>

        {!hasSupabaseConfig && (
          <p className="mb-4 rounded-xl border border-border bg-surface-raised p-3 text-xs text-muted">
            Demo mode: no Supabase backend configured yet. Continuing signs you in as the
            seeded mock account.
          </p>
        )}

        {step === "identify" && (
          <>
            <div className="mb-5 flex rounded-full border border-border p-1">
              {(["email", "phone"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 rounded-full py-2 text-sm font-medium capitalize ${
                    method === m ? "bg-accent text-accent-foreground" : "text-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <form onSubmit={requestCode} className="space-y-3">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                type={method === "email" ? "email" : "tel"}
                placeholder={method === "email" ? "you@example.com" : "+1 555 123 4567"}
                required={hasSupabaseConfig}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : hasSupabaseConfig ? "Send code" : "Continue"}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <form onSubmit={verifyCode} className="space-y-3">
            <p className="text-sm text-muted">
              Enter the code sent to <span className="font-medium text-foreground">{value}</span>.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="123456"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-accent"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying…" : "Verify & continue"}
            </Button>
            <button
              type="button"
              onClick={() => setStep("identify")}
              className="w-full text-center text-sm text-muted"
            >
              Use a different email or phone
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
