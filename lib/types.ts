// Shared domain types mirroring the Supabase schema in /supabase/migrations.
// Keep in sync with the SQL — this is the single source of truth for the
// frontend's view of each table's shape.

export type RsvpStatus = "interested" | "going" | "spectating";
export type Recurrence = "weekly" | "monthly" | null;
export type ReportTargetType = "photo" | "profile";

export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_location: { lat: number; lng: number } | null;
  meets_attended_count: number;
}

export interface Car {
  id: string;
  profile_id: string;
  make: string;
  model: string;
  year: number | null;
  photo_url: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Meet {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  address?: string | null;
  location: { lat: number; lng: number };
  notification_radius_meters: number;
  start_time: string;
  end_time: string;
  gallery_urls: string[];
  recurrence: Recurrence;
  parent_meet_id: string | null;
  created_at: string;
}

export interface MeetWithHost extends Meet {
  host: Pick<Profile, "id" | "username" | "avatar_url">;
}

export interface Rsvp {
  id: string;
  meet_id: string;
  profile_id: string;
  car_id: string | null;
  status: RsvpStatus;
  created_at: string;
}

export interface RsvpWithProfile extends Rsvp {
  profile: Pick<Profile, "id" | "username" | "avatar_url">;
  car: Pick<Car, "id" | "make" | "model" | "year"> | null;
}

export interface Checkin {
  id: string;
  meet_id: string;
  profile_id: string;
  photo_url: string;
  submitted_at: string;
}

export interface CheckinWithProfile extends Checkin {
  profile: Pick<Profile, "id" | "username" | "avatar_url">;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  profile_id: string;
  type: "new_follower" | "new_rsvp" | "new_meet_nearby";
  actor_id: string | null;
  meet_id: string | null;
  read: boolean;
  created_at: string;
}

// Derived, client-side status for a meet relative to "now".
export type MeetTimeStatus = "upcoming" | "live" | "past";

export function getMeetTimeStatus(
  meet: Pick<Meet, "start_time" | "end_time">,
  now: Date = new Date()
): MeetTimeStatus {
  const start = new Date(meet.start_time);
  const end = new Date(meet.end_time);
  if (now >= start && now <= end) return "live";
  if (now < start) return "upcoming";
  return "past";
}
