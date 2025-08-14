// src/lib/api.ts - Enhanced Firebase Version with Heartbeat
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
  private static CONNECTION_TIMEOUT = 30000; // 30 seconds - ESP32 dianggap offline jika tidak ada update
  private static HEARTBEAT_TIMEOUT = 15000; // 15 seconds - untuk heartbeat check

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

  // 🔥 NEW: Check ESP32 Connection Status based on last heartbeat/timestamp
  static async checkESP32Connection(): Promise<{
    isOnline: boolean;
    lastSeen: number;
    timeDifference: number;
    status: 'online' | 'offline' | 'unknown';
  }> {
    try {
      // Check heartbeat first (jika ada)
      const heartbeatRef = ref(database, 'esp32/heartbeat');
      const heartbeatSnapshot = await get(heartbeatRef);
      
      // Check sensor timestamp sebagai fallback
      const sensorsRef = ref(database, 'esp32/sensors');
      const sensorsSnapshot = await get(sensorsRef);
      
      let lastTimestamp = 0;
      
      if (heartbeatSnapshot.exists()) {
        // Gunakan heartbeat timestamp (lebih akurat)
        lastTimestamp = heartbeatSnapshot.val();
        console.log('💓 Using heartbeat timestamp:', lastTimestamp);
      } else if (sensorsSnapshot.exists() && sensorsSnapshot.val().timestamp) {
        // Fallback ke sensor timestamp
        lastTimestamp = sensorsSnapshot.val().timestamp;
        console.log('📡 Using sensor timestamp:', lastTimestamp);
      }
      
      if (lastTimestamp === 0) {
        return {
          isOnline: false,
          lastSeen: 0,
          timeDifference: Number.POSITIVE_INFINITY,
          status: 'unknown'
        };
      }
      
      const now = Date.now();
      const timeDifference = now - lastTimestamp;
      
      // ESP32 dianggap online jika timestamp-nya tidak lebih dari CONNECTION_TIMEOUT
      const isOnline = timeDifference < this.CONNECTION_TIMEOUT;
      
      console.log(`🔗 ESP32 Status Check:`, {
        lastTimestamp,
        now,
        timeDifference,
        isOnline,
        thresholdSeconds: this.CONNECTION_TIMEOUT / 1000
      });
      
      return {
        isOnline,
        lastSeen: lastTimestamp,
        timeDifference,
        status: isOnline ? 'online' : 'offline'
      };
      
    } catch (error) {
      console.error('❌ ESP32 connection check failed:', error);
      return {
        isOnline: false,
        lastSeen: 0,
        timeDifference: Number.POSITIVE_INFINITY,
        status: 'unknown'
      };
    }
  }

  // Firebase Methods
  static async getSensors(): Promise<SensorData & { 
    connectionStatus: { 
      isOnline: boolean; 
      lastSeen: number; 
      status: string;
    } 
  }> {
    try {
      // Check connection status
      const connectionStatus = await this.checkESP32Connection();
      
      const sensorsRef = ref(database, 'esp32/sensors');
      const snapshot = await get(sensorsRef);
      
      if (snapshot.exists() && connectionStatus.isOnline) {
        // ESP32 online dan ada data
        const espData = snapshot.val();
        
        // Check if DHT11 data is valid
        const isDHTValid = (
          espData.temperature != null && 
          !isNaN(espData.temperature) && 
          espData.temperature !== 0 &&
          espData.temperature !== -999 &&
          espData.humidity != null && 
          !isNaN(espData.humidity) && 
          espData.humidity !== 0 &&
          espData.humidity !== -999
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
          isWeatherAPI: !isDHTValid,
          connectionStatus
        };
      } else {
        // ESP32 offline atau tidak ada data, gunakan weather API
        console.log('📡 ESP32 offline or no data, using weather API...');
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
          isWeatherAPI: true,
          connectionStatus
        };
      }
    } catch (error) {
      console.error('❌ Firebase getSensors error:', error);
      
      // Ultimate fallback
      try {
        const weatherData = await this.getWeatherData();
        const connectionStatus = { isOnline: false, lastSeen: 0, status: 'error' };
        
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
          isWeatherAPI: true,
          connectionStatus
        };
      } catch (weatherError) {
        throw new Error('Both Firebase and Weather API failed');
      }
    }
  }

  static async getStatus(): Promise<SystemStatus & {
    connectionStatus: {
      isOnline: boolean;
      lastSeen: number;
      status: string;
      lastSeenFormatted: string;
    }
  }> {
    try {
      // Check connection first
      const connectionStatus = await this.checkESP32Connection();
      
      const statusRef = ref(database, 'esp32/status');
      const snapshot = await get(statusRef);
      
      if (snapshot.exists() && connectionStatus.isOnline) {
        const statusData = snapshot.val();
        
        return {
          ...statusData,
          connectionStatus: {
            ...connectionStatus,
            lastSeenFormatted: connectionStatus.lastSeen > 0 
              ? new Date(connectionStatus.lastSeen).toLocaleTimeString()
              : 'Never'
          }
        };
      } else {
        // Return offline status
        console.log('⚠️ ESP32 offline, using default status');
        return {
          servo: { open: false, moving: false },
          led: { builtin: false },
          rgb: { mode: 'OFF', manualMode: false, manualTimeLeft: 0 },
          buzzer: { active: false },
          system: { ready: false, uptime: 0 },
          wifi: { status: 'Offline', ip: '', rssi: 0 },
          timestamp: Date.now(),
          connectionStatus: {
            ...connectionStatus,
            lastSeenFormatted: connectionStatus.lastSeen > 0 
              ? new Date(connectionStatus.lastSeen).toLocaleTimeString()
              : 'Never'
          }
        };
      }
    } catch (error) {
      console.error('❌ Firebase getStatus error:', error);
      throw error;
    }
  }

  // Control Methods - Send commands to Firebase (dengan connection check)
  static async controlLED(state: boolean): Promise<{ success: boolean; message: string }> {
    try {
      // Check if ESP32 is online first
      const connectionStatus = await this.checkESP32Connection();
      
      if (!connectionStatus.isOnline) {
        return {
          success: false,
          message: `ESP32 offline. Last seen: ${Math.floor(connectionStatus.timeDifference / 1000)}s ago`
        };
      }
      
      const controlRef = ref(database, 'esp32/controls/led');
      await set(controlRef, {
        command: state ? 'on' : 'off',
        timestamp: Date.now()
      });
      
      console.log(`🔥 LED command sent: ${state ? 'ON' : 'OFF'}`);
      return {
        success: true,
        message: `LED turned ${state ? 'ON' : 'OFF'}`
      };
    } catch (error) {
      console.error('❌ Firebase controlLED error:', error);
      return {
        success: false,
        message: 'Failed to send LED command'
      };
    }
  }

  static async controlServo(angle: number): Promise<{ success: boolean; message: string }> {
    try {
      const connectionStatus = await this.checkESP32Connection();
      
      if (!connectionStatus.isOnline) {
        return {
          success: false,
          message: `ESP32 offline. Last seen: ${Math.floor(connectionStatus.timeDifference / 1000)}s ago`
        };
      }
      
      const controlRef = ref(database, 'esp32/controls/servo');
      await set(controlRef, {
        command: angle,
        timestamp: Date.now()
      });
      
      console.log(`🔥 Servo command sent: ${angle}°`);
      return {
        success: true,
        message: `Servo moved to ${angle}°`
      };
    } catch (error) {
      console.error('❌ Firebase controlServo error:', error);
      return {
        success: false,
        message: 'Failed to send servo command'
      };
    }
  }

  static async controlRGB(mode: string): Promise<{ success: boolean; message: string }> {
    try {
      const connectionStatus = await this.checkESP32Connection();
      
      if (!connectionStatus.isOnline) {
        return {
          success: false,
          message: `ESP32 offline. Last seen: ${Math.floor(connectionStatus.timeDifference / 1000)}s ago`
        };
      }
      
      const controlRef = ref(database, 'esp32/controls/rgb');
      await set(controlRef, {
        command: mode,
        timestamp: Date.now()
      });
      
      console.log(`🔥 RGB command sent: ${mode}`);
      return {
        success: true,
        message: `RGB mode: ${mode}`
      };
    } catch (error) {
      console.error('❌ Firebase controlRGB error:', error);
      return {
        success: false,
        message: 'Failed to send RGB command'
      };
    }
  }

  // 🔥 UPDATED: Improved connection check method
  static async checkConnection(): Promise<boolean> {
    try {
      const connectionStatus = await this.checkESP32Connection();
      return connectionStatus.isOnline;
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      return false;
    }
  }

  // Real-time listeners untuk live updates
  static onSensorsUpdate(callback: (data: SensorData & { 
    connectionStatus: { 
      isOnline: boolean; 
      lastSeen: number; 
      status: string;
    } 
  }) => void) {
    const sensorsRef = ref(database, 'esp32/sensors');
    console.log('👂 Setting up real-time sensor listener...');
    
    return onValue(sensorsRef, async (snapshot) => {
      // Always check connection status
      const connectionStatus = await this.checkESP32Connection();
      
      if (snapshot.exists() && connectionStatus.isOnline) {
        const espData = snapshot.val();
        
        // Check DHT11 validity
        const isDHTValid = (
          espData.temperature != null && 
          !isNaN(espData.temperature) && 
          espData.temperature !== 0 &&
          espData.temperature !== -999 &&
          espData.humidity != null && 
          !isNaN(espData.humidity) && 
          espData.humidity !== 0 &&
          espData.humidity !== -999
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
          isWeatherAPI: !isDHTValid,
          connectionStatus
        });
      } else {
        // ESP32 offline, send weather data
        const weatherData = await this.getWeatherData();
        callback({
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
          isWeatherAPI: true,
          connectionStatus
        });
      }
    });
  }

  static onStatusUpdate(callback: (data: SystemStatus & {
    connectionStatus: {
      isOnline: boolean;
      lastSeen: number;
      status: string;
      lastSeenFormatted: string;
    }
  }) => void) {
    const statusRef = ref(database, 'esp32/status');
    console.log('👂 Setting up real-time status listener...');
    
    return onValue(statusRef, async (snapshot) => {
      const connectionStatus = await this.checkESP32Connection();
      
      if (snapshot.exists() && connectionStatus.isOnline) {
        callback({
          ...snapshot.val(),
          connectionStatus: {
            ...connectionStatus,
            lastSeenFormatted: connectionStatus.lastSeen > 0 
              ? new Date(connectionStatus.lastSeen).toLocaleTimeString()
              : 'Never'
          }
        });
      } else {
        // ESP32 offline
        callback({
          servo: { open: false, moving: false },
          led: { builtin: false },
          rgb: { mode: 'OFF', manualMode: false, manualTimeLeft: 0 },
          buzzer: { active: false },
          system: { ready: false, uptime: 0 },
          wifi: { status: 'Offline', ip: '', rssi: 0 },
          timestamp: Date.now(),
          connectionStatus: {
            ...connectionStatus,
            lastSeenFormatted: connectionStatus.lastSeen > 0 
              ? new Date(connectionStatus.lastSeen).toLocaleTimeString()
              : 'Never'
          }
        });
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

  // 🔥 NEW: Get detailed connection info
  static async getConnectionInfo() {
    const connectionStatus = await this.checkESP32Connection();
    
    return {
      ...connectionStatus,
      lastSeenFormatted: connectionStatus.lastSeen > 0 
        ? new Date(connectionStatus.lastSeen).toLocaleString('id-ID')
        : 'Never',
      timeOffline: connectionStatus.isOnline 
        ? 0 
        : Math.floor(connectionStatus.timeDifference / 1000)
    };
  }
}