/** Great-circle distance between two points, in meters. Used to filter the
 * mock data layer and for any client-side distance math. */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function metersToMiles(m: number): number {
  return m / 1609.344;
}

export function milesToMeters(mi: number): number {
  return mi * 1609.344;
}

export function formatDistance(m: number): string {
  const mi = metersToMiles(m);
  if (mi < 0.1) return "< 0.1 mi";
  return `${mi.toFixed(mi < 10 ? 1 : 0)} mi`;
}

export function formatRadius(m: number): string {
  const mi = Math.round(metersToMiles(m));
  return `${mi} mi`;
}
