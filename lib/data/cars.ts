import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { Car } from "@/lib/types";
import { mockCars } from "@/lib/mock/data";

export interface CreateCarInput {
  profileId: string;
  make: string;
  model: string;
  year: number | null;
  photoUrl: string | null;
  notes: string | null;
  isPrimary?: boolean;
}

export async function createCar(input: CreateCarInput): Promise<Car> {
  if (!hasSupabaseConfig) {
    const car: Car = {
      id: `c-${Date.now()}`,
      profile_id: input.profileId,
      make: input.make,
      model: input.model,
      year: input.year,
      photo_url: input.photoUrl,
      notes: input.notes,
      is_primary: Boolean(input.isPrimary),
      created_at: new Date().toISOString(),
    };
    mockCars.push(car);
    return car;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cars")
    .insert({
      profile_id: input.profileId,
      make: input.make,
      model: input.model,
      year: input.year,
      photo_url: input.photoUrl,
      notes: input.notes,
      is_primary: Boolean(input.isPrimary),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCar(carId: string): Promise<void> {
  if (!hasSupabaseConfig) {
    const idx = mockCars.findIndex((c) => c.id === carId);
    if (idx >= 0) mockCars.splice(idx, 1);
    return;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("cars").delete().eq("id", carId);
  if (error) throw error;
}
