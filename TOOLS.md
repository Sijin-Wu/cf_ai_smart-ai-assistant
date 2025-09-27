# Tools Documentation

This document describes the tools available in the AI chat agent and their capabilities.

## Available Tools

### 1. Location Tool (`getCurrentLocation`)

**Purpose**: Get the current location of the user based on their IP address or manual input.

**Features**:
- IP-based geolocation using the ip-api.com service
- Manual location input as fallback
- Returns coordinates, timezone, and location details
- Handles errors gracefully with fallback options

**Parameters**:
- `useIP` (boolean, default: true): Whether to use IP-based geolocation
- `manualLocation` (string, optional): Manual location input if not using IP

**Example Usage**:
```
"Get my current location"
"What's my location using my IP address?"
"Set my location to New York, NY"
```

**Response Format**:
```json
{
  "location": "San Francisco, California, United States",
  "coordinates": {
    "lat": 37.7749,
    "lon": -122.4194
  },
  "timezone": "America/Los_Angeles",
  "source": "ip-geolocation"
}
```

### 2. Time Tool (`getLocalTime`)

**Purpose**: Get accurate local time for any location or timezone using WorldTimeAPI.

**Features**:
- Uses WorldTimeAPI for accurate time information
- Supports location names and timezone identifiers
- Provides formatted time, UTC time, and timezone details
- Shows DST (Daylight Saving Time) status
- Fallback to system time if service is unavailable

**Parameters**:
- `location` (string): Location name or timezone (e.g., 'New York', 'America/New_York')

**Example Usage**:
```
"What time is it in London?"
"Get the local time for Tokyo"
"What's the current time in America/Los_Angeles timezone?"
```

**Response Format**:
```json
{
  "location": "London",
  "timezone": "Europe/London",
  "localTime": "Monday, September 25, 2023 at 02:30:45 PM BST",
  "utcTime": "2023-09-25T13:30:45.123456+00:00",
  "isDST": true,
  "utcOffset": "+01:00",
  "unixTimestamp": 1695647445
}
```

### 3. Weather Tool (`getWeatherInformation`)

**Purpose**: Get comprehensive weather information for any city using wttr.in weather service.

**Features**:
- Current weather conditions
- Temperature in both Celsius and Fahrenheit
- Feels-like temperature
- Humidity, pressure, and wind information
- Today's min/max temperatures
- Detailed weather description
- No API key required (uses wttr.in free service)

**Parameters**:
- `city` (string): Name of the city to get weather for

**Example Usage**:
```
"What's the weather in Paris?"
"Get current weather for Tokyo"
"How's the weather in New York City?"
```

**Response Format**:
```json
{
  "location": {
    "city": "Paris",
    "area": "Paris",
    "country": "France",
    "region": "Ile-de-France"
  },
  "current": {
    "temperature": {
      "celsius": 18,
      "fahrenheit": 64
    },
    "feelsLike": {
      "celsius": 16,
      "fahrenheit": 61
    },
    "description": "Partly cloudy",
    "humidity": "65%",
    "pressure": "1013 mb",
    "windSpeed": "15 km/h",
    "windDirection": "SW"
  },
  "today": {
    "date": "2023-09-25",
    "maxTemp": {
      "celsius": 22,
      "fahrenheit": 72
    },
    "minTemp": {
      "celsius": 12,
      "fahrenheit": 54
    }
  },
  "summary": "Current weather in Paris, France: Partly cloudy, 18°C (64°F), feels like 16°C (61°F). Humidity: 65%, Wind: 15 km/h SW."
}
```

## Implementation Details

### Directory Structure
```
src/
├── tools/
│   ├── index.ts          # Tool exports
│   ├── location.ts       # Location-related tools
│   ├── time.ts          # Time-related tools
│   └── weather.ts       # Weather-related tools
└── tools.ts             # Main tool configuration
```

### Key Features

1. **Error Handling**: All tools include comprehensive error handling with fallback options
2. **Type Safety**: Full TypeScript typing for API responses and tool parameters
3. **Free Services**: Uses free, reliable third-party services (no API keys required)
4. **Automatic Execution**: Tools execute automatically without requiring user confirmation
5. **Detailed Responses**: Rich, structured responses with multiple data points

### Service Dependencies

- **Location**: ip-api.com (free IP geolocation service)
- **Time**: worldtimeapi.org (free world time service)
- **Weather**: wttr.in (free weather service)

### Testing the Tools

You can test the tools by asking natural language questions like:
- "Where am I located?"
- "What time is it in Tokyo?"
- "How's the weather in London?"
- "Get my location and current weather"
- "What's the local time for my current location?"

The AI will automatically invoke the appropriate tools and provide comprehensive, formatted responses.