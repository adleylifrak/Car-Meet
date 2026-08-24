import type { MeetWithHost } from "@/lib/types";

export interface MapMeetsProps {
  center: { lat: number; lng: number };
  meets: MeetWithHost[];
  rsvpMeetIds: Set<string>;
  selectedMeetId: string | null;
  onSelectMeet: (meetId: string | null) => void;
  radiusMeters: number;
}
