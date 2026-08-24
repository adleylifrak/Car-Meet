"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Avatar } from "@/components/ui/Avatar";
import { getCurrentProfileClient, getGarage, completeOnboarding } from "@/lib/data/profiles";
import { createCar, deleteCar } from "@/lib/data/cars";
import type { Car, Profile } from "@/lib/types";

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getCurrentProfileClient();
      if (!p) return router.replace("/login");
      setProfile(p);
      setBio(p.bio ?? "");
      if (p.avatar_url) setAvatarUrls([p.avatar_url]);
      setCars(await getGarage(p.id));
    })();
  }, [router]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await completeOnboarding({
        userId: profile.id,
        username: profile.username,
        bio: bio.trim(),
        avatarUrl: avatarUrls[0] ?? null,
        primaryCar: null,
      });
      router.push(`/profile/${profile.username}`);
    } finally {
      setSaving(false);
    }
  }

  async function addCar() {
    if (!profile || !newMake.trim() || !newModel.trim()) return;
    const car = await createCar({
      profileId: profile.id,
      make: newMake.trim(),
      model: newModel.trim(),
      year: newYear ? Number(newYear) : null,
      photoUrl: newPhotos[0] ?? null,
      notes: null,
    });
    setCars((c) => [...c, car]);
    setNewMake("");
    setNewModel("");
    setNewYear("");
    setNewPhotos([]);
  }

  async function removeCar(id: string) {
    setCars((c) => c.filter((car) => car.id !== id));
    await deleteCar(id);
  }

  if (!profile) return null;

  return (
    <div>
      <TopBar title="Edit profile" />
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Avatar url={avatarUrls[0]} name={profile.username} size="xl" />
          <ImagePicker
            urls={avatarUrls}
            onChange={(urls) => setAvatarUrls(urls.slice(-1))}
            bucket="avatars"
            pathPrefix={profile.id}
            max={1}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>

        <div className="border-t border-border pt-6">
          <p className="mb-3 text-sm font-semibold">Garage</p>
          <div className="mb-4 space-y-2">
            {cars.map((car) => (
              <div key={car.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm">
                  {car.year ? `${car.year} ` : ""}
                  {car.make} {car.model}
                </span>
                <button onClick={() => removeCar(car.id)} className="text-danger" aria-label="Remove car">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
            <p className="text-xs font-medium text-muted">Add a car</p>
            <div className="flex gap-2">
              <input
                value={newMake}
                onChange={(e) => setNewMake(e.target.value)}
                placeholder="Make"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Model"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <input
                value={newYear}
                onChange={(e) => setNewYear(e.target.value.replace(/\D/g, ""))}
                placeholder="Year"
                inputMode="numeric"
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
            <ImagePicker urls={newPhotos} onChange={(u) => setNewPhotos(u.slice(-1))} bucket="cars" pathPrefix={profile.id} max={1} />
            <Button size="sm" onClick={addCar}>Add to garage</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
