import { GeoPoint, FarmField } from '../types';

/**
 * Earth radius in meters
 */
const EARTH_RADIUS = 6378137;

/**
 * Calculates geodesic area of a polygon using spherical excess / shoelace projection in square meters.
 */
export function calculatePolygonArea(coordinates: GeoPoint[]): { areaM2: number; areaHa: number } {
  if (!coordinates || coordinates.length < 3) {
    return { areaM2: 0, areaHa: 0 };
  }

  let area = 0;
  const numPoints = coordinates.length;

  for (let i = 0; i < numPoints; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[(i + 1) % numPoints];

    const lat1Rad = (p1.lat * Math.PI) / 180;
    const lat2Rad = (p2.lat * Math.PI) / 180;
    const lng1Rad = (p1.lng * Math.PI) / 180;
    const lng2Rad = (p2.lng * Math.PI) / 180;

    area += (lng2Rad - lng1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
  }

  area = (Math.abs(area) * EARTH_RADIUS * EARTH_RADIUS) / 2.0;

  const areaM2 = Math.round(area * 10) / 10;
  const areaHa = Math.round((areaM2 / 10000) * 100) / 100;

  return { areaM2, areaHa };
}

/**
 * Computes polygon centroid
 */
export function calculatePolygonCentroid(coordinates: GeoPoint[]): GeoPoint {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 10.598, lng: 105.894 };
  }

  let totalLat = 0;
  let totalLng = 0;

  for (const point of coordinates) {
    totalLat += point.lat;
    totalLng += point.lng;
  }

  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length,
  };
}

/**
 * Computes bounding box for a set of coordinates or fields
 */
export function calculateBoundingBox(coordinates: GeoPoint[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  if (!coordinates || coordinates.length === 0) {
    return { minLat: 10.5, maxLat: 10.7, minLng: 105.8, maxLng: 106.0 };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of coordinates) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Distance between two points in meters using Haversine formula
 */
export function calculateDistanceMeters(p1: GeoPoint, p2: GeoPoint): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS * c);
}

/**
 * Ray-casting algorithm to test if a point is inside a polygon
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng,
      yi = polygon[i].lat;
    const xj = polygon[j].lng,
      yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Check if two line segments (p1-q1) and (p2-q2) intersect
 */
function doIntersect(p1: GeoPoint, q1: GeoPoint, p2: GeoPoint, q2: GeoPoint): boolean {
  function orientation(p: GeoPoint, q: GeoPoint, r: GeoPoint): number {
    const val = (q.lat - p.lat) * (r.lng - q.lng) - (q.lng - p.lng) * (r.lat - q.lat);
    if (Math.abs(val) < 1e-9) return 0;
    return val > 0 ? 1 : 2;
  }

  function onSegment(p: GeoPoint, q: GeoPoint, r: GeoPoint): boolean {
    return (
      q.lng <= Math.max(p.lng, r.lng) &&
      q.lng >= Math.min(p.lng, r.lng) &&
      q.lat <= Math.max(p.lat, r.lat) &&
      q.lat >= Math.min(p.lat, r.lat)
    );
  }

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

/**
 * Check if a polygon intersects with any existing fields
 */
export function checkPolygonOverlap(
  newPolygon: GeoPoint[],
  existingFields: FarmField[],
  ignoreFieldId?: string
): { hasOverlap: boolean; overlappingFieldNames: string[] } {
  if (newPolygon.length < 3) return { hasOverlap: false, overlappingFieldNames: [] };

  const overlappingFieldNames: string[] = [];

  for (const field of existingFields) {
    if (ignoreFieldId && field.id === ignoreFieldId) continue;
    const poly = field.coordinates;
    if (poly.length < 3) continue;

    let overlaps = false;

    // Check if any point of new is inside existing
    for (const pt of newPolygon) {
      if (isPointInPolygon(pt, poly)) {
        overlaps = true;
        break;
      }
    }

    // Check if any point of existing is inside new
    if (!overlaps) {
      for (const pt of poly) {
        if (isPointInPolygon(pt, newPolygon)) {
          overlaps = true;
          break;
        }
      }
    }

    // Check edge intersections
    if (!overlaps) {
      for (let i = 0; i < newPolygon.length; i++) {
        const p1 = newPolygon[i];
        const q1 = newPolygon[(i + 1) % newPolygon.length];

        for (let j = 0; j < poly.length; j++) {
          const p2 = poly[j];
          const q2 = poly[(j + 1) % poly.length];

          if (doIntersect(p1, q1, p2, q2)) {
            overlaps = true;
            break;
          }
        }
        if (overlaps) break;
      }
    }

    if (overlaps) {
      overlappingFieldNames.push(field.name);
    }
  }

  return {
    hasOverlap: overlappingFieldNames.length > 0,
    overlappingFieldNames,
  };
}

/**
 * Generates an official Vietnamese Planting Unit Code (PUC)
 * Standard format: VN-[PROVINCE_CODE]-[YEAR]-[6_DIGIT_SEQ]
 * e.g., VN-ST-2026-000123
 */
export function generatePucCode(provinceCode = 'ST'): string {
  const year = new Date().getFullYear();
  const randomSeq = Math.floor(100000 + Math.random() * 900000);
  return `VN-${provinceCode.toUpperCase()}-${year}-${randomSeq}`;
}
