/**
 * Maps country codes/names to flag emojis for display in admin reports.
 * Falls back to a globe emoji when unknown.
 */

// Common country name → ISO-2 mapping (covers EU markets + most frequent traffic origins)
const NAME_TO_ISO: Record<string, string> = {
  // EU active markets
  netherlands: "NL",
  spain: "ES",
  portugal: "PT",
  germany: "DE",
  france: "FR",
  italy: "IT",
  belgium: "BE",
  "united kingdom": "GB",
  uk: "GB",
  "great britain": "GB",
  switzerland: "CH",
  austria: "AT",
  ireland: "IE",
  sweden: "SE",
  denmark: "DK",
  norway: "NO",
  poland: "PL",
  "czech republic": "CZ",
  czechia: "CZ",
  greece: "GR",
  luxembourg: "LU",
  // Other frequent origins
  "united states": "US",
  usa: "US",
  brazil: "BR",
  brasil: "BR",
  canada: "CA",
  mexico: "MX",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  russia: "RU",
  china: "CN",
  japan: "JP",
  india: "IN",
  australia: "AU",
  romania: "RO",
  hungary: "HU",
  finland: "FI",
  turkey: "TR",
  ukraine: "UA",
};

/**
 * Convert ISO-2 country code (e.g., "NL") to a flag emoji 🇳🇱
 * by mapping each letter to its Regional Indicator Symbol.
 */
function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "🌐";
  const code = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  const A = 0x1f1e6;
  const a = "A".charCodeAt(0);
  return String.fromCodePoint(A + (code.charCodeAt(0) - a)) +
         String.fromCodePoint(A + (code.charCodeAt(1) - a));
}

/**
 * Returns the flag emoji for a country value that may be either an ISO-2 code
 * (e.g., "NL") or a full country name (e.g., "Netherlands").
 */
export function getCountryFlag(input: string | null | undefined): string {
  if (!input) return "🌐";
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === "unknown") return "🌐";

  // Exact ISO-2 match
  if (trimmed.length === 2) return isoToFlag(trimmed);

  // Name lookup (case-insensitive)
  const iso = NAME_TO_ISO[trimmed.toLowerCase()];
  if (iso) return isoToFlag(iso);

  return "🌐";
}

/**
 * Returns a human-readable country label, preferring the original input
 * (so already-localized names render naturally).
 */
export function getCountryLabel(input: string | null | undefined): string {
  if (!input || input.trim().toLowerCase() === "unknown") return "Desconhecido";
  return input.trim();
}
