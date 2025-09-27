/**
 * Time-related tools for getting local time information
 */
import { tool } from "ai";
import { z } from "zod/v3";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

// Type definition for TimeAPI.io response
interface TimeAPIResponse {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  seconds: number;
  milliSeconds: number;
  dateTime: string;
  date: string;
  time: string;
  timeZone: string;
  dayOfWeek: string;
  dstActive: boolean;
}

// Type definition for IP geolocation response
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
 * Helper function to detect current location via IP geolocation
 */
async function detectCurrentLocation(): Promise<string | null> {
  try {
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

    if (!data.error && data.city && data.timezone) {
      // Return the timezone if available, otherwise construct location string
      return data.timezone || `${data.city}, ${data.region || data.country_name}`;
    } else {
      throw new Error(data.reason || "Failed to get location");
    }
  } catch (error) {
    console.error("Error detecting current location:", error);
    return null;
  }
}

/**
 * Use OpenAI to intelligently determine the timezone for a given location
 */
async function getTimezoneFromAI(location: string): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: openai('gpt-5'),
      messages: [
        {
          role: 'system',
          content: `You are a timezone expert. Given a location name (which could be a city, landmark, neighborhood, or any specific place), return ONLY the exact IANA timezone identifier (e.g., "America/New_York", "Europe/London", "Asia/Tokyo").

Rules:
- Return ONLY the timezone identifier, nothing else
- For US locations: Use appropriate America/ timezone (New_York, Los_Angeles, Chicago, Denver, Phoenix, etc.)
- For landmarks/neighborhoods, use the timezone of their city (e.g., Times Square → America/New_York, Santa Monica Pier → America/Los_Angeles)
- For ambiguous names, choose the most likely major location
- If uncertain, return "UNKNOWN"

Examples:
- "New York" → "America/New_York"
- "NYC" → "America/New_York" 
- "Brooklyn" → "America/New_York"
- "Manhattan" → "America/New_York"
- "Times Square" → "America/New_York"
- "Santa Monica Pier" → "America/Los_Angeles"
- "Hollywood" → "America/Los_Angeles"
- "London" → "Europe/London"
- "Tokyo" → "Asia/Tokyo"
- "Paris" → "Europe/Paris"`
        },
        {
          role: 'user',
          content: location
        }
      ],
      temperature: 0.1
    });

    const timezone = text.trim();
    
    // Validate that it looks like a proper timezone
    if (timezone === "UNKNOWN" || !timezone.includes('/')) {
      return null;
    }
    
    return timezone;
  } catch (error) {
    console.error('OpenAI timezone detection error:', error);
    return null;
  }
}

/**
 * Get local time for a specified location or timezone
 * Uses TimeAPI.io to get accurate time information with AI-powered timezone detection
 * Automatically detects current location when user says "here", "now", "current", etc.
 */
export const getLocalTime = tool({
  description:
    "Get the current local time for a specified location or timezone. Can handle specific locations like 'Times Square', 'Santa Monica Pier', neighborhoods, landmarks, and any city worldwide. Automatically detects your current location if you say 'here', 'now', 'current location', or similar phrases.",
  inputSchema: z.object({
    location: z
      .string()
      .describe(
        "Location name (e.g., 'New York', 'Times Square', 'Santa Monica Pier', 'Brooklyn') or timezone (e.g., 'America/New_York', 'Europe/London'). Use words like 'here', 'now', 'current' to auto-detect current location."
      )
  }),
  execute: async ({ location }) => {
    // Check if user wants current location
    const needsCurrentLocation = /\b(here|now|current|my location|where i am)\b/i.test(location);
    
    let actualLocation = location;
    
    try {
      console.log("Getting time for location:", location);
      
      if (needsCurrentLocation) {
        console.log("Detecting current location automatically...");
        
        try {
          const detectedLocation = await detectCurrentLocation();
          
          if (detectedLocation) {
            actualLocation = detectedLocation;
            console.log(`Auto-detected location: ${actualLocation}`);
          } else {
            console.log("Failed to auto-detect location, using fallback");
            actualLocation = "America/New_York"; // fallback to ET
          }
        } catch (locationError) {
          console.log("Location detection failed, using fallback");
          actualLocation = "America/New_York"; // fallback to ET
        }
      }
      
      // First, try to use the actualLocation as a timezone directly
      let apiUrl = `https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(actualLocation)}`;
      let response = await fetch(apiUrl);
      console.log(`Attempting direct timezone lookup for "${actualLocation}"...`);
      let matchedTimezone = actualLocation;

      // If direct timezone lookup fails, use AI to detect the timezone
      if (!response.ok) {
        console.log(`Direct timezone lookup failed for "${actualLocation}", using AI detection...`);
        
        const aiDetectedTimezone = await getTimezoneFromAI(actualLocation);
        
        if (aiDetectedTimezone) {
          console.log(`AI detected timezone for "${actualLocation}": ${aiDetectedTimezone}`);
          matchedTimezone = aiDetectedTimezone;
          apiUrl = `https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(aiDetectedTimezone)}`;
          response = await fetch(apiUrl);
        }
      }

      if (!response.ok) {
        throw new Error(`Could not find timezone for location: ${actualLocation}. AI suggested: ${matchedTimezone}, but timezone API failed with status: ${response.status}`);
      }

      const data = (await response.json()) as TimeAPIResponse;

      // Format the datetime for better readability
      const date = new Date(data.dateTime);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
      };

      const formattedTime = date.toLocaleDateString("en-US", options);

      // Convert to UTC for consistency
      const utcTime = new Date(data.dateTime).toISOString();
      const unixTimestamp = Math.floor(new Date(data.dateTime).getTime() / 1000);

      return {
        requestedLocation: location,
        actualLocation: needsCurrentLocation ? actualLocation : undefined,
        detectedTimezone: data.timeZone,
        localTime: formattedTime,
        utcTime: utcTime,
        isDST: data.dstActive,
        dayOfWeek: data.dayOfWeek,
        date: data.date,
        time: data.time,
        unixTimestamp: unixTimestamp,
        success: true,
        method: matchedTimezone === actualLocation ? 'direct' : 'ai-detected',
        locationDetection: needsCurrentLocation ? 'auto-detected' : 'user-provided'
      };
    } catch (error) {
      console.error("Error getting local time:", error);

      return {
        requestedLocation: location,
        actualLocation: needsCurrentLocation ? actualLocation : undefined,
        error: `Could not get time for ${actualLocation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: "Please try with a different location name or check if the location exists",
        success: false,
        locationDetection: needsCurrentLocation ? 'auto-detected' : 'user-provided'
      };
    }
  }
});
