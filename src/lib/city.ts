export const NWA_CITIES = [
  "Fayetteville",
  "Bentonville",
  "Springdale",
  "Rogers",
  "Bella Vista",
] as const;

export type NwaCity = (typeof NWA_CITIES)[number];

export function extractCity(
  locationAddress: string | null,
  locationName: string | null
): string | null {
  const text = locationAddress || locationName;
  if (!text) return null;

  const lower = text.toLowerCase();
  for (const city of NWA_CITIES) {
    if (lower.includes(city.toLowerCase())) {
      return city;
    }
  }
  return null;
}
