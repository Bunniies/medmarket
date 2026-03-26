/**
 * Geocode a city + country to coordinates using Nominatim (OpenStreetMap).
 * Free, no API key required. Respects Nominatim usage policy (1 req/s).
 */
export async function geocodeCity(
  city: string,
  country: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = encodeURIComponent(`${city}, ${country}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "MedMarket/1.0 (hospital-medicine-exchange)",
        },
        // Don't cache — each call should be fresh
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
  } catch {
    // Geocoding is best-effort — never block registration on failure
  }
  return null;
}
