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
  // Flag untuk menandai data dari weather API
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

// Interface untuk weather data
export interface WeatherData {
  temperature: number;
  humidity: number;
  source: 'dht11' | 'weather_api';
}

// NEW: Interface untuk connection info
export interface ConnectionInfo {
  isOnline: boolean;
  lastSeen: number;
  timeDifference: number;
  status: 'online' | 'offline' | 'unknown' | 'error';
  lastSeenFormatted: string;
  timeOffline: number;
}

// API response types - what actually comes from the API
export interface APIConnectionStatus {
  isOnline: boolean;
  lastSeen: number;
  status: string;
  timeDifference?: number;
  lastSeenFormatted?: string;
  timeOffline?: number;
}

// Interface untuk API response dengan connection status
export interface SensorDataWithConnection extends SensorData {
  connectionStatus: ConnectionInfo;
}

export interface SystemStatusWithConnection extends SystemStatus {
  connectionStatus: ConnectionInfo;
}

// What the API actually returns
export interface APISensorResponse extends SensorData {
  connectionStatus: APIConnectionStatus;
}

export interface APISystemResponse extends SystemStatus {
  connectionStatus: APIConnectionStatus;
}