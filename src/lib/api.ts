// src/lib/api.ts - Firebase Version
import { database, ref, onValue, set, get } from './firebase';
import { SensorData, SystemStatus } from '@/types';
import axios from 'axios';

// Keep weather API for DHT11 backup
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || 'your_api_key_here';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

const DEFAULT_LOCATION = {
  lat: parseFloat(process.env.NEXT_PUBLIC_LOCATION_LAT || '-6.2088'),
  lon: parseFloat(process.env.NEXT_PUBLIC_LOCATION_LON || '106.8456'),
  city: process.env.NEXT_PUBLIC_LOCATION_CITY || 'Jakarta'
};

const weatherApi = axios.create({
  baseURL: WEATHER_API_BASE,
  timeout: 10000,
});

export class SmartHomeAPI {
  // Weather cache
  private static weatherCache: {
    data: { temperature: number; humidity: number } | null;
    timestamp: number;
  } = {
    data: null,
    timestamp: 0
  };

  private static CACHE_DURATION = 600000; // 10 minutes

  static async getWeatherData(): Promise<{ temperature: number; humidity: number }> {
    const now = Date.now();
    
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
          units: 'metric'
        }
      });

      const weatherData = {
        temperature: Math.round(response.data.main.temp * 10) / 10,
        humidity: Math.round(response.data.main.humidity * 10) / 10
      };

      this.weatherCache.data = weatherData;
      this.weatherCache.timestamp = now;

      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      return { 
        temperature: 28.5, // Default Indonesia temp
        humidity: 65.0 
      };
    }
  }

  // Firebase Methods
  static async getSensors(): Promise<SensorData> {
    try {
      const sensorsRef = ref(database, 'esp32/sensors');
      const snapshot = await get(sensorsRef);
      
      if (snapshot.exists()) {
        const espData = snapshot.val();
        
        // Check if DHT11 data is valid
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

        // Fallback to weather API if DHT11 invalid
        if (!isDHTValid) {
          console.log('🌡️ DHT11 invalid, using weather API...');
          const weatherData = await this.getWeatherData();
          temperature = weatherData.temperature;
          humidity = weatherData.humidity;
        }

        return {
          ...espData,
          temperature,
          humidity,
          isWeatherAPI: !isDHTValid
        };
      } else {
        // No ESP32 data, use weather API
        console.log('📡 No ESP32 data, using weather API...');
        const weatherData = await this.getWeatherData();
        return {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          lightLevel: 0,
          distance: 0,
          motionDetected: false,
          isDark: false,
          joystickPressed: false,
          joyX: 2048,
          joyY: 2048,
          timestamp: Math.floor(Date.now() / 1000),
          isWeatherAPI: true
        };
      }
    } catch (error) {
      console.error('❌ Firebase getSensors error:', error);
      
      // Ultimate fallback
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
          joyX: 2048,
          joyY: 2048,
          timestamp: Math.floor(Date.now() / 1000),
          isWeatherAPI: true
        };
      } catch (weatherError) {
        throw new Error('Both Firebase and Weather API failed');
      }
    }
  }

  static async getStatus(): Promise<SystemStatus> {
    try {
      const statusRef = ref(database, 'esp32/status');
      const snapshot = await get(statusRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        // Return default status if no data
        console.log('⚠️ No status data, using defaults');
        return {
          servo: { open: false, moving: false },
          led: { builtin: false },
          rgb: { mode: 'OFF', manualMode: false, manualTimeLeft: 0 }, //nambahin fitur aneh (inget manualMode)
          buzzer: { active: false },
          system: { ready: false, uptime: 0 },
          wifi: { status: 'Unknown', ip: '', rssi: 0 },
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('❌ Firebase getStatus error:', error);
      throw error;
    }
  }

  // Control Methods - Send commands to Firebase
  static async controlLED(state: boolean): Promise<void> {
    try {
      const controlRef = ref(database, 'esp32/controls/led');
      await set(controlRef, {
        command: state ? 'on' : 'off',
        timestamp: Date.now()
      });
      console.log(`🔥 LED command sent: ${state ? 'ON' : 'OFF'}`);
    } catch (error) {
      console.error('❌ Firebase controlLED error:', error);
      throw error;
    }
  }

  static async controlServo(angle: number): Promise<void> {
    try {
      const controlRef = ref(database, 'esp32/controls/servo');
      await set(controlRef, {
        command: angle,
        timestamp: Date.now()
      });
      console.log(`🔥 Servo command sent: ${angle}°`);
    } catch (error) {
      console.error('❌ Firebase controlServo error:', error);
      throw error;
    }
  }

  static async controlRGB(mode: string): Promise<void> {
    try {
      const controlRef = ref(database, 'esp32/controls/rgb');
      await set(controlRef, {
        command: mode,
        timestamp: Date.now()
      });
      console.log(`🔥 RGB command sent: ${mode}`);
    } catch (error) {
      console.error('❌ Firebase controlRGB error:', error);
      throw error;
    }
  }

  static async checkConnection(): Promise<boolean> {
    try {
      const statusRef = ref(database, 'esp32/status/system/ready');
      const snapshot = await get(statusRef);
      const isConnected = snapshot.exists() && snapshot.val() === true;
      console.log(`🔗 ESP32 connection: ${isConnected ? 'ONLINE' : 'OFFLINE'}`);
      return isConnected;
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      return false;
    }
  }

  // Real-time listeners untuk live updates
  static onSensorsUpdate(callback: (data: SensorData) => void) {
    const sensorsRef = ref(database, 'esp32/sensors');
    console.log('👂 Setting up real-time sensor listener...');
    
    return onValue(sensorsRef, async (snapshot) => {
      if (snapshot.exists()) {
        const espData = snapshot.val();
        
        // Check DHT11 validity
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

        if (!isDHTValid) {
          const weatherData = await this.getWeatherData();
          temperature = weatherData.temperature;
          humidity = weatherData.humidity;
        }

        callback({
          ...espData,
          temperature,
          humidity,
          isWeatherAPI: !isDHTValid
        });
      }
    });
  }

  static onStatusUpdate(callback: (data: SystemStatus) => void) {
    const statusRef = ref(database, 'esp32/status');
    console.log('👂 Setting up real-time status listener...');
    
    return onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
  }

  // Utility methods
  static async refreshWeatherData(): Promise<void> {
    this.weatherCache.timestamp = 0;
    await this.getWeatherData();
  }

  // Test Firebase connection
  static async testFirebase(): Promise<boolean> {
    try {
      const testRef = ref(database, 'test');
      await set(testRef, { timestamp: Date.now(), status: 'connected' });
      console.log('✅ Firebase connection test: SUCCESS');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection test: FAILED', error);
      return false;
    }
  }
}