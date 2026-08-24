import type {
  AppNotification,
  Badge,
  Car,
  Checkin,
  Meet,
  Profile,
  Rsvp,
} from "@/lib/types";

// Seeded, in-memory data used whenever Supabase env vars are absent, so the
// whole UI is browsable and demoable before a backend is wired up.
// Centered on downtown Los Angeles.

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();

export const MOCK_SELF_ID = "p-you";

export const mockProfiles: Profile[] = [
  {
    id: MOCK_SELF_ID,
    username: "you",
    bio: "JDM enthusiast. Daily driving a slightly-too-loud WRX.",
    avatar_url: null,
    email: "you@example.com",
    phone: null,
    created_at: hoursFromNow(-2000),
    last_location: { lat: 34.0522, lng: -118.2437 },
    meets_attended_count: 14,
  },
  {
    id: "p-mika",
    username: "mika.builds",
    bio: "S13 project car, slow build, faster progress lately.",
    avatar_url: null,
    email: null,
    phone: null,
    created_at: hoursFromNow(-4000),
    last_location: { lat: 34.06, lng: -118.25 },
    meets_attended_count: 47,
  },
  {
    id: "p-dre",
    username: "dre_e46",
    bio: "E46 M3, track days when the paycheck allows it.",
    avatar_url: null,
    email: null,
    phone: null,
    created_at: hoursFromNow(-6000),
    last_location: { lat: 34.04, lng: -118.23 },
    meets_attended_count: 8,
  },
  {
    id: "p-sam",
    username: "sam_spectates",
    bio: "No car yet, still show up every week.",
    avatar_url: null,
    email: null,
    phone: null,
    created_at: hoursFromNow(-1000),
    last_location: { lat: 34.05, lng: -118.26 },
    meets_attended_count: 3,
  },
];

export const mockCars: Car[] = [
  {
    id: "c-you-1",
    profile_id: MOCK_SELF_ID,
    make: "Subaru",
    model: "WRX",
    year: 2019,
    photo_url: null,
    notes: "Stage 2, could be louder.",
    is_primary: true,
    created_at: hoursFromNow(-2000),
  },
  {
    id: "c-mika-1",
    profile_id: "p-mika",
    make: "Nissan",
    model: "240SX",
    year: 1996,
    photo_url: null,
    notes: "S13, LS swap in progress.",
    is_primary: true,
    created_at: hoursFromNow(-4000),
  },
  {
    id: "c-dre-1",
    profile_id: "p-dre",
    make: "BMW",
    model: "M3",
    year: 2004,
    photo_url: null,
    notes: "E46, track alignment.",
    is_primary: true,
    created_at: hoursFromNow(-6000),
  },
];

export const mockMeets: Meet[] = [
  {
    id: "m-live-1",
    host_id: "p-mika",
    title: "Downtown Rooftop Meet",
    description:
      "Top level of the Grand Ave parking structure. Enter from 5th, security is chill if we keep it tidy.",
    location: { lat: 34.0511, lng: -118.2521 },
    notification_radius_meters: 16000,
    start_time: hoursFromNow(-1),
    end_time: hoursFromNow(2),
    gallery_urls: [],
    recurrence: "weekly",
    parent_meet_id: null,
    created_at: hoursFromNow(-48),
  },
  {
    id: "m-upcoming-1",
    host_id: "p-dre",
    title: "Griffith Overlook Cars & Coffee",
    description: "Early meet before it gets crowded with tourists. Bring a jacket.",
    location: { lat: 34.118, lng: -118.3004 },
    notification_radius_meters: 24000,
    start_time: hoursFromNow(20),
    end_time: hoursFromNow(23),
    gallery_urls: [],
    recurrence: null,
    parent_meet_id: null,
    created_at: hoursFromNow(-20),
  },
  {
    id: "m-upcoming-2",
    host_id: "p-you",
    title: "South Bay Night Cruise Meetup",
    description: "Static meet before the cruise, roll out at 9.",
    location: { lat: 33.97, lng: -118.28 },
    notification_radius_meters: 20000,
    start_time: hoursFromNow(72),
    end_time: hoursFromNow(75),
    gallery_urls: [],
    recurrence: "monthly",
    parent_meet_id: null,
    created_at: hoursFromNow(-5),
  },
  {
    id: "m-past-1",
    host_id: "p-mika",
    title: "Warehouse District Static",
    description: "Photo-focused static meet, no burnouts please.",
    location: { lat: 34.03, lng: -118.235 },
    notification_radius_meters: 15000,
    start_time: hoursFromNow(-24 * 6),
    end_time: hoursFromNow(-24 * 6 + 3),
    gallery_urls: [],
    recurrence: null,
    parent_meet_id: null,
    created_at: hoursFromNow(-24 * 10),
  },
  {
    id: "m-past-2",
    host_id: "p-dre",
    title: "Angeles Crest Sunrise Run",
    description: "Meet at the base before sunrise, ride together.",
    location: { lat: 34.24, lng: -118.06 },
    notification_radius_meters: 30000,
    start_time: hoursFromNow(-24 * 20),
    end_time: hoursFromNow(-24 * 20 + 4),
    gallery_urls: [],
    recurrence: null,
    parent_meet_id: null,
    created_at: hoursFromNow(-24 * 25),
  },
];

export const mockRsvps: Rsvp[] = [
  { id: "r1", meet_id: "m-live-1", profile_id: MOCK_SELF_ID, car_id: "c-you-1", status: "going", created_at: hoursFromNow(-40) },
  { id: "r2", meet_id: "m-live-1", profile_id: "p-dre", car_id: "c-dre-1", status: "going", created_at: hoursFromNow(-30) },
  { id: "r3", meet_id: "m-live-1", profile_id: "p-sam", car_id: null, status: "spectating", created_at: hoursFromNow(-20) },
  { id: "r4", meet_id: "m-upcoming-1", profile_id: MOCK_SELF_ID, car_id: null, status: "interested", created_at: hoursFromNow(-10) },
  { id: "r5", meet_id: "m-upcoming-1", profile_id: "p-mika", car_id: "c-mika-1", status: "going", created_at: hoursFromNow(-8) },
  { id: "r6", meet_id: "m-upcoming-2", profile_id: "p-dre", car_id: "c-dre-1", status: "going", created_at: hoursFromNow(-4) },
  { id: "r7", meet_id: "m-past-1", profile_id: MOCK_SELF_ID, car_id: "c-you-1", status: "going", created_at: hoursFromNow(-24 * 10) },
];

export const mockCheckins: Checkin[] = [
  { id: "ch1", meet_id: "m-past-1", profile_id: MOCK_SELF_ID, photo_url: "", submitted_at: hoursFromNow(-24 * 6 + 1) },
  { id: "ch2", meet_id: "m-past-1", profile_id: "p-mika", photo_url: "", submitted_at: hoursFromNow(-24 * 6 + 1.2) },
  { id: "ch3", meet_id: "m-past-2", profile_id: "p-dre", photo_url: "", submitted_at: hoursFromNow(-24 * 20 + 1) },
];

export const mockBadges: Badge[] = [
  { profile_id: MOCK_SELF_ID, badge_type: "5", earned_at: hoursFromNow(-2000) },
  { profile_id: MOCK_SELF_ID, badge_type: "10", earned_at: hoursFromNow(-500) },
  { profile_id: "p-mika", badge_type: "5", earned_at: hoursFromNow(-3000) },
  { profile_id: "p-mika", badge_type: "10", earned_at: hoursFromNow(-2500) },
  { profile_id: "p-mika", badge_type: "25", earned_at: hoursFromNow(-1500) },
];

export const mockNotifications: AppNotification[] = [
  { id: "n1", profile_id: MOCK_SELF_ID, type: "new_rsvp", actor_id: "p-dre", meet_id: "m-upcoming-2", read: false, created_at: hoursFromNow(-3) },
  { id: "n2", profile_id: MOCK_SELF_ID, type: "new_follower", actor_id: "p-sam", meet_id: null, read: false, created_at: hoursFromNow(-9) },
  { id: "n3", profile_id: MOCK_SELF_ID, type: "new_meet_nearby", actor_id: "p-dre", meet_id: "m-upcoming-1", read: true, created_at: hoursFromNow(-20) },
];

export const mockFollows = [
  { follower_id: MOCK_SELF_ID, following_id: "p-mika" },
  { follower_id: "p-sam", following_id: MOCK_SELF_ID },
  { follower_id: "p-dre", following_id: MOCK_SELF_ID },
];
