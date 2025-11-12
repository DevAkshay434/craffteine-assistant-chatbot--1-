export interface ToolResult {
  success: boolean;
  data: string;
  error?: string;
}

export const getCurrentTime = (): ToolResult => {
  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
    return {
      success: true,
      data: timeString
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: 'Failed to get current time'
    };
  }
};

export const getCurrentDate = (): ToolResult => {
  try {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return {
      success: true,
      data: dateString
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: 'Failed to get current date'
    };
  }
};

export const getWeather = async (location?: string): Promise<ToolResult> => {
  try {
    let latitude = 37.7749;
    let longitude = -122.4194;
    let cityName = 'San Francisco';

    if (location && location.toLowerCase() !== 'current') {
      const geoResult = await geocodeLocation(location);
      if (geoResult) {
        latitude = geoResult.latitude;
        longitude = geoResult.longitude;
        cityName = geoResult.name;
      }
    }

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`;
    
    const response = await fetch(weatherUrl);
    const data = await response.json();
    
    if (data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      const weatherCode = data.current_weather.weathercode;
      const condition = getWeatherCondition(weatherCode);
      
      return {
        success: true,
        data: `${temp}°F and ${condition} in ${cityName}`
      };
    }
    
    return {
      success: false,
      data: '',
      error: 'Weather data not available'
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: 'Failed to fetch weather data'
    };
  }
};

const geocodeLocation = async (location: string): Promise<{ latitude: number; longitude: number; name: string } | null> => {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partly cloudy';
  if (code <= 48) return 'foggy';
  if (code <= 67) return 'rainy';
  if (code <= 77) return 'snowy';
  if (code <= 82) return 'showery';
  if (code <= 99) return 'stormy';
  return 'cloudy';
};

export const calculate = (expression: string): ToolResult => {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    if (!sanitized) {
      return {
        success: false,
        data: '',
        error: 'Invalid mathematical expression'
      };
    }
    
    const result = Function(`'use strict'; return (${sanitized})`)();
    
    if (typeof result === 'number' && !isNaN(result)) {
      return {
        success: true,
        data: `${expression} = ${result}`
      };
    }
    
    return {
      success: false,
      data: '',
      error: 'Could not calculate result'
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: 'Invalid calculation'
    };
  }
};

export const searchWeb = async (query: string): Promise<ToolResult> => {
  try {
    const apiKey = import.meta.env.VITE_BRAVE_SEARCH_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        data: '',
        error: 'Search API key not configured'
      };
    }
    
    const braveUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;
    
    const response = await fetch(braveUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Search failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.web?.results && data.web.results.length > 0) {
      const topResults = data.web.results.slice(0, 3);
      const formattedResults = topResults
        .map((result: any, index: number) => {
          const title = result.title || 'No title';
          const description = result.description || 'No description';
          return `${index + 1}. ${title}\n   ${description}`;
        })
        .join('\n\n');
      
      return {
        success: true,
        data: `${formattedResults}`
      };
    }
    
    return {
      success: false,
      data: '',
      error: `No search results found for "${query}"`
    };
  } catch (error) {
    return {
      success: false,
      data: '',
      error: `Web search temporarily unavailable. Please try again later.`
    };
  }
};
