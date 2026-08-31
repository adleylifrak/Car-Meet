import { hasSupabaseConfig } from "@/lib/supabase/client";
import type { Meet, MeetWithHost, Recurrence } from "@/lib/types";
import { mockMeets, mockProfiles } from "@/lib/mock/data";
import { distanceMeters } from "@/lib/geo";

export interface NearbyMeetsParams {
  lat: number;
  lng: number;
  radiusMeters: number;
}

interface NearbyMeetRow {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  notification_radius_meters: number;
  start_time: string;
  end_time: string;
  gallery_urls: string[] | null;
  recurrence: Recurrence;
  parent_meet_id: string | null;
  created_at: string;
  host_username: string;
  host_avatar_url: string | null;
}

type MeetWithHostRow = Omit<NearbyMeetRow, "host_username" | "host_avatar_url"> & {
  host: MeetWithHost["host"];
};

function toMeetWithHost(meet: Meet): MeetWithHost {
  const host = mockProfiles.find((p) => p.id === meet.host_id);
  return {
    ...meet,
    host: host
      ? { id: host.id, username: host.username, avatar_url: host.avatar_url }
      : { id: meet.host_id, username: "unknown", avatar_url: null },
  };
}


/** Returns every meet for global map discovery. Time/status filters stay client-side. */
export async function getAllMeets(): Promise<MeetWithHost[]> {
  if (!hasSupabaseConfig) return mockMeets.map(toMeetWithHost);

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meets")
    .select(
      "id, host_id, title, description, address, lat, lng, notification_radius_meters, start_time, end_time, gallery_urls, recurrence, parent_meet_id, created_at, host:profiles!meets_host_id_fkey(id, username, avatar_url)"
    )
    .order("start_time", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as MeetWithHostRow[]).map((row): MeetWithHost => ({
    id: row.id,
    host_id: row.host_id,
    title: row.title,
    description: row.description,
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    notification_radius_meters: row.notification_radius_meters,
    start_time: row.start_time,
    end_time: row.end_time,
    gallery_urls: row.gallery_urls ?? [],
    recurrence: row.recurrence,
    parent_meet_id: row.parent_meet_id,
    created_at: row.created_at,
    host: row.host,
  }));
}

/** All meets within `radiusMeters` of (lat, lng). Backed by the `nearby_meets`
 * Postgres RPC (see supabase/migrations) so PostGIS does the distance math. */
export async function getNearbyMeets({
  lat,
  lng,
  radiusMeters,
}: NearbyMeetsParams): Promise<MeetWithHost[]> {
  if (!hasSupabaseConfig) {
    return mockMeets
      .filter((m) => distanceMeters({ lat, lng }, m.location) <= radiusMeters)
      .map(toMeetWithHost);
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase.rpc("nearby_meets", {
    center_lat: lat,
    center_lng: lng,
    radius_m: radiusMeters,
  });
  if (error) throw error;
  return ((data ?? []) as NearbyMeetRow[]).map(
    (row): MeetWithHost => ({
      id: row.id,
      host_id: row.host_id,
      title: row.title,
      description: row.description,
      location: { lat: row.lat, lng: row.lng },
      notification_radius_meters: row.notification_radius_meters,
      start_time: row.start_time,
      end_time: row.end_time,
      gallery_urls: row.gallery_urls ?? [],
      recurrence: row.recurrence,
      parent_meet_id: row.parent_meet_id,
      created_at: row.created_at,
      host: {
        id: row.host_id,
        username: row.host_username,
        avatar_url: row.host_avatar_url,
      },
    })
  );
}

export async function getMeetById(id: string): Promise<MeetWithHost | null> {
  if (!hasSupabaseConfig) {
    const meet = mockMeets.find((m) => m.id === id);
    return meet ? toMeetWithHost(meet) : null;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meets")
    .select(
      "id, host_id, title, description, address, lat, lng, notification_radius_meters, start_time, end_time, gallery_urls, recurrence, parent_meet_id, created_at, host:profiles!meets_host_id_fkey(id, username, avatar_url)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    host_id: data.host_id,
    title: data.title,
    description: data.description,
    address: data.address,
    location: { lat: data.lat, lng: data.lng },
    notification_radius_meters: data.notification_radius_meters,
    start_time: data.start_time,
    end_time: data.end_time,
    gallery_urls: data.gallery_urls ?? [],
    recurrence: data.recurrence,
    parent_meet_id: data.parent_meet_id,
    created_at: data.created_at,
    host: data.host as unknown as MeetWithHost["host"],
  };
}

/** Fetches saved meets regardless of browse radius so every RSVP stays pinned. */
export async function getMeetsByIds(ids: string[]): Promise<MeetWithHost[]> {
  if (ids.length === 0) return [];
  if (!hasSupabaseConfig) {
    const wanted = new Set(ids);
    return mockMeets.filter((meet) => wanted.has(meet.id)).map(toMeetWithHost);
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meets")
    .select(
      "id, host_id, title, description, lat, lng, notification_radius_meters, start_time, end_time, gallery_urls, recurrence, parent_meet_id, created_at, host:profiles!meets_host_id_fkey(id, username, avatar_url)"
    )
    .in("id", ids);
  if (error) throw error;

  return ((data ?? []) as unknown as MeetWithHostRow[]).map((row): MeetWithHost => ({
    id: row.id,
    host_id: row.host_id,
    title: row.title,
    description: row.description,
    location: { lat: row.lat, lng: row.lng },
    notification_radius_meters: row.notification_radius_meters,
    start_time: row.start_time,
    end_time: row.end_time,
    gallery_urls: row.gallery_urls ?? [],
    recurrence: row.recurrence,
    parent_meet_id: row.parent_meet_id,
    created_at: row.created_at,
    host: row.host,
  }));
}

export interface CreateMeetInput {
  hostId: string;
  title: string;
  description: string;
  address: string | null;
  lat: number;
  lng: number;
  notificationRadiusMeters: number;
  startTime: string;
  endTime: string;
  galleryUrls: string[];
  recurrence: Recurrence;
}

export async function createMeet(input: CreateMeetInput): Promise<Meet> {
  if (!hasSupabaseConfig) {
    const meet: Meet = {
      id: `m-${Date.now()}`,
      host_id: input.hostId,
      title: input.title,
      description: input.description,
      address: input.address,
      location: { lat: input.lat, lng: input.lng },
      notification_radius_meters: input.notificationRadiusMeters,
      start_time: input.startTime,
      end_time: input.endTime,
      gallery_urls: input.galleryUrls,
      recurrence: input.recurrence,
      parent_meet_id: null,
      created_at: new Date().toISOString(),
    };
    mockMeets.unshift(meet);
    return meet;
  }
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meets")
    .insert({
      host_id: input.hostId,
      title: input.title,
      description: input.description,
      address: input.address,
      location: `SRID=4326;POINT(${input.lng} ${input.lat})`,
      notification_radius_meters: input.notificationRadiusMeters,
      start_time: input.startTime,
      end_time: input.endTime,
      gallery_urls: input.galleryUrls,
      recurrence: input.recurrence,
    })
    .select("id, host_id, title, description, address, lat, lng, notification_radius_meters, start_time, end_time, gallery_urls, recurrence, parent_meet_id, created_at")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    host_id: data.host_id,
    title: data.title,
    description: data.description,
    address: data.address,
    location: { lat: data.lat, lng: data.lng },
    notification_radius_meters: data.notification_radius_meters,
    start_time: data.start_time,
    end_time: data.end_time,
    gallery_urls: data.gallery_urls ?? [],
    recurrence: data.recurrence,
    parent_meet_id: data.parent_meet_id,
    created_at: data.created_at,
  };
}
