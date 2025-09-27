/**
 * Location-related tools for getting user location
 */
import { tool } from "ai";
import { z } from "zod/v3";

// Type definition for IP geolocation API response
interface IPGeoLocationResponse {
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_name?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  error?: boolean;
  reason?: string;
}

/**
 * Get current location based on IP address or user input
 * This tool can get location from IP geolocation services
 */
export const getCurrentLocation = tool({
  description:
    "Get the current location of the user based on their IP address or manual input",
  inputSchema: z.object({
    useIP: z
      .boolean()
      .default(true)
      .describe("Whether to use IP-based geolocation or manual input"),
    manualLocation: z
      .string()
      .optional()
      .describe("Manual location input (city, country) if not using IP")
  }),
  execute: async ({ useIP, manualLocation }) => {
    if (!useIP && manualLocation) {
      // Return manual location if provided
      return {
        location: manualLocation,
        source: "manual",
        coordinates: null
      };
    }

    try {
      // Use a free IP geolocation service
      const response = await fetch("https://ipapi.co/json/", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LocationBot/1.0)"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as IPGeoLocationResponse;

      if (!data.error && data.city) {
        return {
          location: `${data.city}, ${data.region || data.country_name}, ${data.country_name}`,
          coordinates: {
            lat: data.latitude || 0,
            lon: data.longitude || 0
          },
          timezone: data.timezone,
          source: "ip-geolocation"
        };
      } else {
        throw new Error(data.reason || "Failed to get location");
      }
    } catch (error) {
      console.error("Error getting location:", error);

      // Fallback to manual input if IP geolocation fails
      if (manualLocation) {
        return {
          location: manualLocation,
          source: "manual-fallback",
          coordinates: null,
          error: "IP geolocation failed, using manual input"
        };
      }

      return {
        error: `Failed to get location: ${error instanceof Error ? error.message : "Unknown error"}`,
        source: "error"
      };
    }
  }
});
