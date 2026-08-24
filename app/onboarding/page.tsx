"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Avatar } from "@/components/ui/Avatar";
import { hasSupabaseConfig } from "@/lib/supabase/client";
import { completeOnboarding, isUsernameTaken } from "@/lib/data/profiles";

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(() => (hasSupabaseConfig ? null : "p-you"));
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [carPhotos, setCarPhotos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.replace("/login");
      setUserId(user.id);
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;
    if (username.trim().length < 3) return setError("Username needs at least 3 characters.");
    if (!/^[a-z0-9._]+$/i.test(username.trim())) {
      return setError("Letters, numbers, dots, and underscores only.");
    }

    setSubmitting(true);
    try {
      if (await isUsernameTaken(username.trim())) {
        setError("That username is already taken.");
        return;
      }
      await completeOnboarding({
        userId,
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrls[0] ?? null,
        primaryCar:
          make.trim() && model.trim()
            ? {
                make: make.trim(),
                model: model.trim(),
                year: year ? Number(year) : null,
                photoUrl: carPhotos[0] ?? null,
              }
            : null,
      });
      router.push("/map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-sm px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Set up your profile</h1>
      <p className="mb-8 text-sm text-muted">
        Just the basics — you can add more to your garage later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrls[0]} name={username || "?"} size="xl" />
          <ImagePicker
            urls={avatarUrls}
            onChange={(urls) => setAvatarUrls(urls.slice(-1))}
            bucket="avatars"
            pathPrefix={userId ?? "pending"}
            max={1}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mika.builds"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="What do you drive, what do you show up for?"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Primary car (optional)</p>
          <div className="mb-2 flex gap-2">
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              placeholder="Year"
              inputMode="numeric"
              className="w-24 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <ImagePicker
            urls={carPhotos}
            onChange={(urls) => setCarPhotos(urls.slice(-1))}
            bucket="cars"
            pathPrefix={userId ?? "pending"}
            max={1}
            label="Car photo"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={submitting || !userId}>
          {submitting ? "Setting up…" : "Enter CarMeet"}
        </Button>
      </form>
    </div>
  );
}
