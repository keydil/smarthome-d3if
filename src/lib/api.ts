// src/lib/api.ts
import axios from 'axios';
import { SensorData, SystemStatus, ControlRequest } from '@/types';

// Environment variables untuk deployment
const ESP32_IP = process.env.NEXT_PUBLIC_ESP32_IP || '192.168.100.43';
const API_BASE = ESP32_IP.startsWith('http') ? ESP32_IP : `http://${ESP32_IP}`;

// OpenWeatherMap API Configuration
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'your_api_key_here';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Lokasi dari environment variables
const DEFAULT_LOCATION = {
  lat: parseFloat(process.env.NEXT_PUBLIC_LOCATION_LAT || '-6.2088'),
  lon: parseFloat(process.env.NEXT_PUBLIC_LOCATION_LON || '106.8456'),
  city: process.env.NEXT_PUBLIC_LOCATION_CITY || 'Jakarta'
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

const weatherApi = axios.create({
  baseURL: WEATHER_API_BASE,
  timeout: 10000,
});

export class SmartHomeAPI {
  // Cache untuk weather data supaya ga terlalu sering hit API
  private static weatherCache: {
    data: { temperature: number; humidity: number } | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0
  };

  // Cache duration: 10 minutes (600000 ms)
  private static CACHE_DURATION = 600000;

  static async getWeatherData(): Promise<{ temperature: number; humidity: number }> {
    const now = Date.now();
    
    // Check cache first
    if (
      this.weatherCache.data && 
      (now - this.weatherCache.timestamp) < this.CACHE_DURATION
    ) {
      return this.weatherCache.data;
    }

    try {
      const response = await weatherApi.get('/weather', {
        params: {
          lat: DEFAULT_LOCATION.lat,
          lon: DEFAULT_LOCATION.lon,
          appid: WEATHER_API_KEY,
          units: 'metric' // Celsius
        }
      });

      const weatherData = {
        temperature: Math.round(response.data.main.temp * 10) / 10, // Round to 1 decimal
        humidity: Math.round(response.data.main.humidity * 10) / 10
      };

      // Update cache
      this.weatherCache.data = weatherData;
      this.weatherCache.timestamp = now;

      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      
      // Fallback ke data dummy yang masuk akal untuk Indonesia
      const fallbackData = {
        temperature: 28.5, // Suhu rata-rata Indonesia
        humidity: 65.0     // Kelembaban rata-rata
      };
      
      return fallbackData;
    }
  }

  static async getSensors(): Promise<SensorData> {
    try {
      const response = await api.get('/api/sensors');
      const espData = response.data;
      
      // Cek apakah DHT11 data valid (bukan 0, null, undefined, atau NaN)
      const isDHTValid = (
        espData.temperature != null && 
        !isNaN(espData.temperature) && 
        espData.temperature !== 0 &&
        espData.humidity != null && 
        !isNaN(espData.humidity) && 
        espData.humidity !== 0
      );

      let temperature = espData.temperature;
      let humidity = espData.humidity;

      // Kalo DHT11 ga valid, pake weather API
      if (!isDHTValid) {
        console.log('DHT11 sensor invalid, using weather API...');
        const weatherData = await this.getWeatherData();
        temperature = weatherData.temperature;
        humidity = weatherData.humidity;
      }

      return {
        ...espData,
        temperature,
        humidity,
        // Tambahin flag buat nandain kalo data dari API
        isWeatherAPI: !isDHTValid
      };
    } catch (error) {
      console.error('Error fetching sensors:', error);
      
      // Jika ESP32 ga bisa diakses, pake weather API untuk suhu/kelembaban
      try {
        const weatherData = await this.getWeatherData();
        return {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          lightLevel: 0,
          distance: 0,
          motionDetected: false,
          isDark: false,
          joystickPressed: false,
          joyX: 0,
          joyY: 0,
          timestamp: Math.floor(Date.now() / 1000),
          isWeatherAPI: true
        };
      } catch (weatherError) {
        throw error; // Throw original error jika weather API juga gagal
      }
    }
  }

  static async getStatus(): Promise<SystemStatus> {
    try {
      const response = await api.get('/api/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching status:', error);
      throw error;
    }
  }

  static async controlLED(state: boolean): Promise<void> {
    try {
      await api.post('/api/control/led', { state });
    } catch (error) {
      console.error('Error controlling LED:', error);
      throw error;
    }
  }

  static async controlServo(angle: number): Promise<void> {
    try {
      await api.post('/api/control/servo', { angle });
    } catch (error) {
      console.error('Error controlling servo:', error);
      throw error;
    }
  }

  static async controlRGB(mode: string): Promise<void> {
    try {
      await api.post('/api/control/rgb', { mode });
    } catch (error) {
      console.error('Error controlling RGB:', error);
      throw error;
    }
  }

  static async checkConnection(): Promise<boolean> {
    try {
      await api.get('/', { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Method buat manual refresh weather data
  static async refreshWeatherData(): Promise<void> {
    this.weatherCache.timestamp = 0; // Reset cache
    await this.getWeatherData();
  }
}