export function normalizeFlightNumber(input: string): {
  flightNumber?: string;
  callsign?: string;
  airlineIcao?: string;
  airlineIata?: string;
} {
  const cleaned = input.trim().toUpperCase();

  // Pattern: BA1489 or BAW1489
  const flightPattern = /^([A-Z]{2,3})(\d{1,4}[A-Z]?)$/;
  const match = cleaned.match(flightPattern);

  if (!match) {
    return { callsign: cleaned };
  }

  const airline = match[1];
  const number = match[2];

  // 2-letter = IATA, 3-letter = ICAO
  if (airline.length === 2) {
    return {
      airlineIata: airline,
      flightNumber: `${airline}${number}`,
    };
  }

  return {
    airlineIcao: airline,
    callsign: `${airline}${number}`,
    flightNumber: `${convertIcaoToIata(airline)}${number}`,
  };
}

export function convertIcaoToIata(icao: string): string {
  // Common conversions - in production, use database lookup
  const conversions: Record<string, string> = {
    BAW: 'BA', // British Airways
    UAL: 'UA', // United
    AAL: 'AA', // American
    DAL: 'DL', // Delta
    AFR: 'AF', // Air France
    KLM: 'KL', // KLM
    DLH: 'LH', // Lufthansa
    UAE: 'EK', // Emirates
    QTR: 'QR', // Qatar
    SIA: 'SQ', // Singapore
    CPA: 'CX', // Cathay Pacific
    RYR: 'FR', // Ryanair
    EZY: 'U2', // easyJet
  };

  return conversions[icao] || icao.slice(0, 2);
}

export function convertIataToIcao(iata: string): string {
  const conversions: Record<string, string> = {
    BA: 'BAW',
    UA: 'UAL',
    AA: 'AAL',
    DL: 'DAL',
    AF: 'AFR',
    KL: 'KLM',
    LH: 'DLH',
    EK: 'UAE',
    QR: 'QTR',
    SQ: 'SIA',
    CX: 'CPA',
    FR: 'RYR',
    U2: 'EZY',
  };

  return conversions[iata] || iata + 'X'; // fallback
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula - returns distance in meters
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function normalizeStandName(standName: string): string {
  // Normalize A10, A010, A-10, Gate A10, etc. to A10
  return standName
    .toUpperCase()
    .replace(/GATE\s*/i, '')
    .replace(/STAND\s*/i, '')
    .replace(/^0+/, '')
    .replace(/-/g, '')
    .trim();
}

export function matchesAircraftSize(
  aircraftWingspan: number,
  standMaxWingspan?: number
): boolean {
  if (!standMaxWingspan) return true; // No restriction
  return aircraftWingspan <= standMaxWingspan;
}

export function getAircraftSizeCode(wingspan: number): string {
  // ICAO Aerodrome Reference Code
  if (wingspan < 15) return 'A';
  if (wingspan < 24) return 'B';
  if (wingspan < 36) return 'C';
  if (wingspan < 52) return 'D';
  if (wingspan < 65) return 'E';
  return 'F';
}
