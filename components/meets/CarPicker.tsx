"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { getGarage } from "@/lib/data/profiles";
import { createCar } from "@/lib/data/cars";
import type { Car } from "@/lib/types";

export function CarPicker({
  profileId,
  selectedCarId,
  onSelect,
}: {
  profileId: string;
  selectedCarId: string | null;
  onSelect: (carId: string) => void;
}) {
  const [garage, setGarage] = useState<Car[]>([]);
  const [typingIn, setTypingIn] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getGarage(profileId).then(setGarage);
  }, [profileId]);

  async function submitTypedCar() {
    if (!make.trim() || !model.trim()) return;
    setSaving(true);
    try {
      const car = await createCar({
        profileId,
        make: make.trim(),
        model: model.trim(),
        year: year ? Number(year) : null,
        photoUrl: null,
        notes: null,
      });
      setGarage((g) => [...g, car]);
      onSelect(car.id);
      setTypingIn(false);
      setMake("");
      setModel("");
      setYear("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      {garage.map((car) => (
        <label
          key={car.id}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
        >
          <input
            type="radio"
            name="car"
            className="accent-accent"
            checked={selectedCarId === car.id}
            onChange={() => onSelect(car.id)}
          />
          <span className="text-sm">
            {car.year ? `${car.year} ` : ""}
            {car.make} {car.model}
          </span>
        </label>
      ))}

      {!typingIn ? (
        <button
          type="button"
          onClick={() => setTypingIn(true)}
          className="text-sm font-medium text-accent"
        >
          + Type in a different car
        </button>
      ) : (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex gap-2">
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              placeholder="Year"
              inputMode="numeric"
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="button" size="sm" onClick={submitTypedCar} disabled={saving}>
            {saving ? "Saving…" : "Use this car"}
          </Button>
        </div>
      )}
    </div>
  );
}
