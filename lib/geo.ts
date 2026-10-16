type Point = { latitude: number; longitude: number };

export function distanceKm(a: Point, b: Point) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Nearest-neighbour ordering; returns the ordered points and the route length in km. */
export function planRoute<T extends Point>(points: T[]) {
  const left = [...points];
  const ordered: T[] = [];
  let km = 0;
  while (left.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    if (last) {
      let min = Infinity;
      left.forEach((p, i) => {
        const d = distanceKm(last, p);
        if (d < min) {
          min = d;
          best = i;
        }
      });
      km += min;
    }
    ordered.push(left.splice(best, 1)[0]);
  }
  return { ordered, km };
}

export const mapsUrl = ({ latitude, longitude }: Point) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
