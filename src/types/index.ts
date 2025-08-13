// src/types/index.ts
export interface SensorData {
  temperature: number;
  humidity: number;
  lightLevel: number;
  distance: number;
  motionDetected: boolean;
  isDark: boolean;
  joystickPressed: boolean;
  joyX: number;
  joyY: number;
  timestamp: number;
  // Tambahin flag buat nandain kalo data dari weather API
  isWeatherAPI?: boolean;
}

export interface SystemStatus {
  servo: {
    open: boolean;
    moving: boolean;
  };
  led: {
    builtin: boolean;
  };
  rgb: {
    mode: string;
    manualMode: boolean;
    manualTimeLeft: number;
    //nambahin fitur aneh (inget manualMode)
    //manualMode: boolean;
    //manualTimeLeft: number;
  };
  buzzer: {
    active: boolean;
  };
  system: {
    ready: boolean;
    uptime: number;
  };
  wifi: {
    status: string;
    ip: string;
    rssi: number;
  };
  timestamp: number;
}

export interface ControlRequest {
  type: 'led' | 'servo' | 'rgb' | 'buzzer';
  value: boolean | number | string;
}

// Tambahin interface buat weather data
export interface WeatherData {
  temperature: number;
  humidity: number;
  source: 'dht11' | 'weather_api';
}