/**
 * LocationService handles coordinate approximation and reverse geocoding
 * to protect user privacy while maintaining regional context.
 */

export interface ApproximateLocation {
  latitude: number;  // Reduced precision (~0.1 degree)
  longitude: number; // Reduced precision (~0.1 degree)
  displayName: string; // "Near [City], [Country]"
}

export class LocationService {
  /**
   * Approximates coordinates to city/region level (~0.1 degree precision, ~11km)
   * This protects user privacy by reducing location precision.
   */
  coordinatesToApproximate(lat: number, lng: number): { lat: number; lng: number } {
    // Round to 1 decimal place (~11km precision at equator)
    const approximateLat = Math.round(lat * 10) / 10;
    const approximateLng = Math.round(lng * 10) / 10;

    return {
      lat: approximateLat,
      lng: approximateLng
    };
  }

  /**
   * Performs reverse geocoding using Nominatim API (OpenStreetMap)
   * Returns a location string in format "Near [City], [Country]"
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Use Nominatim API with appropriate headers
      // Use internal API proxy to handle geocoding server-side
      const url = `/api/geocode?lat=${lat}&lng=${lng}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      // Extract address components with more fallbacks
      const address = data.address || {};

      // Try to find the most specific location name
      const locationName =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.suburb ||
        address.county ||
        address.state ||
        address.region ||
        address.island;

      const country = address.country;

      if (locationName && country) {
        return `Near ${locationName}, ${country}`;
      } else if (locationName) {
        return `Near ${locationName}`;
      } else if (country) {
        return `Somewhere in ${country}`;
      } else if (data.display_name) {
        // Fallback to the full display name if nothing else specific behaves, but truncate it
        const parts = data.display_name.split(', ');
        if (parts.length >= 2) {
          return `Near ${parts[0]}, ${parts[parts.length - 1]}`;
        }
        return `Near ${parts[0]}`;
      } else {
        // Absolute fallback if everything fails
        return `Near ${lat.toFixed(1)}°, ${lng.toFixed(1)}°`;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback to coordinate display
      return `Near ${lat.toFixed(1)}°, ${lng.toFixed(1)}°`;
    }
  }

  /**
   * Main method to approximate location and get display name
   * Combines coordinate approximation with reverse geocoding
   */
  async approximateLocation(lat: number, lng: number): Promise<ApproximateLocation> {
    // First, approximate the coordinates
    const approximate = this.coordinatesToApproximate(lat, lng);

    // Then, reverse geocode the approximate coordinates
    const displayName = await this.reverseGeocode(approximate.lat, approximate.lng);

    return {
      latitude: approximate.lat,
      longitude: approximate.lng,
      displayName
    };
  }
}

// Export singleton instance
export const locationService = new LocationService();
