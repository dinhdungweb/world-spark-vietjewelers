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
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WorldSpark/1.0' // Required by Nominatim usage policy
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract city and country from response
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.county || 'Unknown Location';
      const country = address.country || 'Unknown Country';
      
      return `Near ${city}, ${country}`;
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
