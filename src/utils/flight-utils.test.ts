import { normalizeFlightNumber, calculateDistance, normalizeStandName } from '../utils/flight-utils';

describe('Flight Utils', () => {
  describe('normalizeFlightNumber', () => {
    it('should parse IATA flight numbers', () => {
      const result = normalizeFlightNumber('BA1489');
      expect(result.airlineIata).toBe('BA');
      expect(result.flightNumber).toBe('BA1489');
    });

    it('should parse ICAO callsigns', () => {
      const result = normalizeFlightNumber('BAW1489');
      expect(result.airlineIcao).toBe('BAW');
      expect(result.callsign).toBe('BAW1489');
    });

    it('should handle lowercase input', () => {
      const result = normalizeFlightNumber('ba1489');
      expect(result.airlineIata).toBe('BA');
    });

    it('should handle unknown formats', () => {
      const result = normalizeFlightNumber('UNKNOWN123');
      expect(result.callsign).toBe('UNKNOWN123');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance(51.4706, -0.4619, 51.4720, -0.4600);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(200); // Should be < 200m
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });
  });

  describe('normalizeStandName', () => {
    it('should normalize stand names', () => {
      expect(normalizeStandName('A10')).toBe('A10');
      expect(normalizeStandName('A010')).toBe('A10');
      expect(normalizeStandName('A-10')).toBe('A10');
      expect(normalizeStandName('Gate A10')).toBe('A10');
      expect(normalizeStandName('gate a10')).toBe('A10');
    });
  });
});
