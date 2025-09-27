/**
 * Weather-related tools for getting weather information
 */
import { tool } from "ai";
import { z } from "zod/v3";

// Fallback weather service using wttr.in (text-based weather service)
interface WttrResponse {
  current_condition: Array<{
    temp_C: string;
    temp_F: string;
    weatherDesc: Array<{ value: string }>;
    humidity: string;
    pressure: string;
    windspeedKmph: string;
    winddir16Point: string;
    feelsLikeC: string;
    feelsLikeF: string;
  }>;
  weather: Array<{
    date: string;
    maxtempC: string;
    maxtempF: string;
    mintempC: string;
    mintempF: string;
  }>;
  nearest_area: Array<{
    areaName: Array<{ value: string }>;
    country: Array<{ value: string }>;
    region: Array<{ value: string }>;
  }>;
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
async function detectCurrentLocationForWeather(): Promise<string | null> {
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

    if (!data.error && data.city) {
      // Return city and country for weather lookup
      return `${data.city}, ${data.country_name || data.country}`;
    } else {
      throw new Error(data.reason || "Failed to get location");
    }
  } catch (error) {
    console.error("Error detecting current location:", error);
    return null;
  }
}

/**
 * Get weather information for a specified city
 * Uses free weather services to provide current weather data
 * Automatically detects current location when user says "here", "now", "current", etc.
 */
export const getWeatherInformation = tool({
  description: "Get current weather information for a specified city. Automatically detects your current location if you say 'here', 'now', 'current location', or similar phrases.",
  inputSchema: z.object({
    city: z
      .string()
      .describe(
        "Name of the city to get weather for (e.g., 'New York', 'London', 'Tokyo'). Use words like 'here', 'now', 'current' to auto-detect current location."
      )
  }),
  execute: async ({ city }) => {
    // Check if user wants current location
    const needsCurrentLocation = /\b(here|now|current|my location|where i am)\b/i.test(city);
    
    let actualCity = city;
    
    try {
      console.log("Getting weather for city:", city);
      
      if (needsCurrentLocation) {
        console.log("Detecting current location automatically...");
        
        try {
          const detectedLocation = await detectCurrentLocationForWeather();
          
          if (detectedLocation) {
            actualCity = detectedLocation;
            console.log(`Auto-detected location: ${actualCity}`);
          } else {
            console.log("Failed to auto-detect location, using fallback");
            actualCity = "New York, NY"; // fallback
          }
        } catch (locationError) {
          console.log("Location detection failed, using fallback");
          actualCity = "New York, NY"; // fallback
        }
      }
      
      // Helper function to fetch weather with retry logic
      const fetchWithRetry = async (url: string, retries = 2): Promise<Response> => {
        for (let i = 0; i <= retries; i++) {
          try {
            const response = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; WeatherBot/1.0)"
              },
              // Add timeout to prevent hanging requests
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (response.ok) {
              return response;
            } else if (i === retries) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
          } catch (fetchError) {
            if (i === retries) {
              throw fetchError;
            }
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
          }
        }
        throw new Error("Max retries exceeded");
      };

      // Using wttr.in as a free weather service (no API key required)
      const response = await fetchWithRetry(
        `https://wttr.in/${encodeURIComponent(actualCity)}?format=j1`
      );

      if (!response.ok) {
        throw new Error(`Weather service error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as WttrResponse;

      // Validate that we have the necessary data
      if (!data.current_condition || !data.current_condition[0]) {
        throw new Error("Invalid weather data received - missing current conditions");
      }
      
      if (!data.nearest_area || !data.nearest_area[0]) {
        throw new Error("Invalid weather data received - missing location data");
      }
      
      if (!data.weather || !data.weather[0]) {
        throw new Error("Invalid weather data received - missing forecast data");
      }

      const current = data.current_condition[0];
      const location = data.nearest_area[0];
      const today = data.weather[0];

      // Convert temperature and other metrics
      const tempC = parseInt(current.temp_C, 10);
      const tempF = parseInt(current.temp_F, 10);
      const feelsLikeC = parseInt(current.feelsLikeC, 10);
      const feelsLikeF = parseInt(current.feelsLikeF, 10);

      return {
        requestedCity: city,
        actualCity: needsCurrentLocation ? actualCity : undefined,
        location: {
          city: city,
          area: location.areaName[0].value,
          country: location.country[0].value,
          region: location.region[0].value
        },
        current: {
          temperature: {
            celsius: tempC,
            fahrenheit: tempF
          },
          feelsLike: {
            celsius: feelsLikeC,
            fahrenheit: feelsLikeF
          },
          description: current.weatherDesc[0].value,
          humidity: `${current.humidity}%`,
          pressure: `${current.pressure} mb`,
          windSpeed: `${current.windspeedKmph} km/h`,
          windDirection: current.winddir16Point
        },
        today: {
          date: today.date,
          maxTemp: {
            celsius: parseInt(today.maxtempC, 10),
            fahrenheit: parseInt(today.maxtempF, 10)
          },
          minTemp: {
            celsius: parseInt(today.mintempC, 10),
            fahrenheit: parseInt(today.mintempF, 10)
          }
        },
        summary: `Current weather in ${location.areaName[0].value}, ${location.country[0].value}: ${current.weatherDesc[0].value}, ${tempC}°C (${tempF}°F), feels like ${feelsLikeC}°C (${feelsLikeF}°F). Humidity: ${current.humidity}%, Wind: ${current.windspeedKmph} km/h ${current.winddir16Point}.`,
        locationDetection: needsCurrentLocation ? 'auto-detected' : 'user-provided'
      };
    } catch (error) {
      console.error("Error getting weather information:", error);

      return {
        requestedCity: city,
        actualCity: needsCurrentLocation ? actualCity : undefined,
        error: `Failed to get weather information for ${actualCity}`,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        suggestion:
          "Please check the city name and try again. Make sure to use a well-known city name.",
        locationDetection: needsCurrentLocation ? 'auto-detected' : 'user-provided'
      };
    }
  }
});
