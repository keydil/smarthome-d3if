"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Droplets,
  Eye,
  Ruler,
  Zap,
  GamepadIcon,
  Home,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Cloud,
  Clock,
  AlertCircle,
} from "lucide-react";

import { BackgroundAnimation } from "@/components/animations/BackgroundAnimation";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { RGBController } from "@/components/dashboard/RGBController";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SmartHomeAPI } from "@/lib/api";
import type { 
  SensorDataWithConnection, 
  SystemStatusWithConnection, 
  ConnectionInfo,
  APISensorResponse,
  APISystemResponse
} from "@/types";

export default function HomePage() {
  // Updated state types to match the new API responses
  const [sensorData, setSensorData] = useState<SensorDataWithConnection>({
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    distance: 0,
    motionDetected: false,
    isDark: false,
    joystickPressed: false,
    joyX: 0,
    joyY: 0,
    timestamp: 0,
    isWeatherAPI: false,
    connectionStatus: {
      isOnline: false,
      lastSeen: 0,
      timeDifference: 0,
      status: 'unknown',
      lastSeenFormatted: 'Never',
      timeOffline: 0
    }
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatusWithConnection>({
    servo: { open: false, moving: false },
    led: { builtin: false },
    rgb: { mode: 'OFF', manualMode: false, manualTimeLeft: 0 },
    buzzer: { active: false },
    system: { ready: false, uptime: 0 },
    wifi: { status: "Disconnected", ip: "", rssi: 0 },
    timestamp: 0,
    connectionStatus: {
      isOnline: false,
      lastSeen: 0,
      timeDifference: 0,
      status: 'unknown',
      lastSeenFormatted: 'Never',
      timeOffline: 0
    }
  });

  const [isMounted, setIsMounted] = useState(false);
  
  // Simplified connectionInfo - derived from sensorData and systemStatus
  const connectionInfo: ConnectionInfo = sensorData.connectionStatus;

  const [isLoading, setIsLoading] = useState({
    led: false,
    servo: false,
    rgb: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [controlMessages, setControlMessages] = useState<string[]>([]);

  // Add control message helper
  const addControlMessage = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `${timestamp}: ${message}`;
    
    setControlMessages(prev => [fullMessage, ...prev.slice(0, 4)]); // Keep last 5 messages
    
    if (isError) {
      setError(message);
    }
  };

  // Enhanced data fetching with connection status
  const fetchData = useCallback(async () => {
    try {
      const [sensors, status]: [APISensorResponse, APISystemResponse] = await Promise.all([
        SmartHomeAPI.getSensors(),
        SmartHomeAPI.getStatus(),
      ]);

      // Transform sensors data to match SensorDataWithConnection type
      const sensorConnectionStatus: ConnectionInfo = {
        isOnline: sensors.connectionStatus?.isOnline || false,
        lastSeen: sensors.connectionStatus?.lastSeen || 0,
        timeDifference: sensors.connectionStatus?.timeDifference || 0,
        status: (sensors.connectionStatus?.status as ConnectionInfo['status']) || 'unknown',
        lastSeenFormatted: sensors.connectionStatus?.lastSeenFormatted || 'Never',
        timeOffline: sensors.connectionStatus?.timeOffline || 0
      };

      const transformedSensors: SensorDataWithConnection = {
        ...sensors,
        connectionStatus: sensorConnectionStatus
      };

      // Transform status data to match SystemStatusWithConnection type
      const statusConnectionStatus: ConnectionInfo = {
        isOnline: status.connectionStatus?.isOnline || false,
        lastSeen: status.connectionStatus?.lastSeen || 0,
        timeDifference: status.connectionStatus?.timeDifference || 0,
        status: (status.connectionStatus?.status as ConnectionInfo['status']) || 'unknown',
        lastSeenFormatted: status.connectionStatus?.lastSeenFormatted || 'Never',
        timeOffline: status.connectionStatus?.timeOffline || 0
      };

      const transformedStatus: SystemStatusWithConnection = {
        ...status,
        connectionStatus: statusConnectionStatus
      };

      setSensorData(transformedSensors);
      setSystemStatus(transformedStatus);
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to connect to Firebase");
      
      // Update connection status in case of error
      const errorConnectionInfo: ConnectionInfo = {
        isOnline: false,
        lastSeen: 0,
        timeDifference: Number.POSITIVE_INFINITY,
        status: 'error',
        lastSeenFormatted: 'Never',
        timeOffline: 0
      };

      setSensorData(prev => ({
        ...prev,
        connectionStatus: errorConnectionInfo
      }));
      
      setSystemStatus(prev => ({
        ...prev,
        connectionStatus: errorConnectionInfo
      }));
    }
  }, []);

  // Enhanced connection check using the new API method
  const checkDetailedConnection = useCallback(async () => {
    try {
      const connInfo = await SmartHomeAPI.getConnectionInfo();
      
      // Ensure connInfo has all required properties
      const fullConnectionInfo: ConnectionInfo = {
        isOnline: connInfo.isOnline || false,
        lastSeen: connInfo.lastSeen || 0,
        timeDifference: connInfo.timeDifference || 0,
        status: (connInfo.status as ConnectionInfo['status']) || 'unknown',
        lastSeenFormatted: connInfo.lastSeenFormatted || 'Never',
        timeOffline: connInfo.timeOffline || 0
      };
      
      // Update both sensor and system connection info
      setSensorData(prev => ({
        ...prev,
        connectionStatus: fullConnectionInfo
      }));
      
      setSystemStatus(prev => ({
        ...prev,
        connectionStatus: fullConnectionInfo
      }));
      
      if (!connInfo.isOnline) {
        setError(`ESP32 offline for ${connInfo.timeOffline}s`);
      }
    } catch (err) {
      console.error("Connection check failed:", err);
      const errorConnectionInfo: ConnectionInfo = {
        isOnline: false,
        lastSeen: 0,
        timeDifference: Number.POSITIVE_INFINITY,
        status: 'error',
        lastSeenFormatted: 'Never',
        timeOffline: 0
      };

      setSensorData(prev => ({
        ...prev,
        connectionStatus: errorConnectionInfo
      }));
      
      setSystemStatus(prev => ({
        ...prev,
        connectionStatus: errorConnectionInfo
      }));
    }
  }, []);

  // Manual weather refresh
  const refreshWeatherData = async () => {
    try {
      await SmartHomeAPI.refreshWeatherData();
      await fetchData();
      addControlMessage("Weather data refreshed");
    } catch (err) {
      console.error("Failed to refresh weather data:", err);
      addControlMessage("Failed to refresh weather data", true);
    }
  };

  // Enhanced control functions with better error handling
  const handleLEDToggle = async () => {
    setIsLoading((prev) => ({ ...prev, led: true }));
    try {
      const result = await SmartHomeAPI.controlLED(!systemStatus.led.builtin);
      
      if (result.success) {
        addControlMessage(result.message);
        await fetchData(); // Refresh data
      } else {
        addControlMessage(result.message, true);
      }
    } catch (err) {
      console.error("LED control failed:", err);
      addControlMessage("LED control failed", true);
    } finally {
      setIsLoading((prev) => ({ ...prev, led: false }));
    }
  };

  const handleServoToggle = async () => {
    setIsLoading((prev) => ({ ...prev, servo: true }));
    try {
      const newAngle = systemStatus.servo.open ? 90 : 0;
      const result = await SmartHomeAPI.controlServo(newAngle);
      
      if (result.success) {
        addControlMessage(result.message);
        await fetchData(); // Refresh data
      } else {
        addControlMessage(result.message, true);
      }
    } catch (err) {
      console.error("Servo control failed:", err);
      addControlMessage("Servo control failed", true);
    } finally {
      setIsLoading((prev) => ({ ...prev, servo: false }));
    }
  };

  const handleRGBModeChange = async (mode: string) => {
    setIsLoading((prev) => ({ ...prev, rgb: true }));
    try {
      const result = await SmartHomeAPI.controlRGB(mode);
      
      if (result.success) {
        addControlMessage(result.message);
        await fetchData(); // Refresh data
      } else {
        addControlMessage(result.message, true);
      }
    } catch (err) {
      console.error("RGB control failed:", err);
      addControlMessage("RGB control failed", true);
    } finally {
      setIsLoading((prev) => ({ ...prev, rgb: false }));
    }
  };

  // Effects
  useEffect(() => {
    checkDetailedConnection();
    fetchData();

    const interval = setInterval(() => {
      if (connectionInfo.isOnline) {
        fetchData();
      } else {
        checkDetailedConnection();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [checkDetailedConnection, fetchData, connectionInfo.isOnline]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Connection status badge component
  const getConnectionBadge = () => {
    if (connectionInfo.status === 'online') {
      return (
        <Badge variant="default" className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white">
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </Badge>
      );
    } else if (connectionInfo.status === 'offline') {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1 px-3 py-1">
          <WifiOff className="h-3 w-3" />
          <span>Offline {connectionInfo.timeOffline}s</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1 px-3 py-1">
          <AlertCircle className="h-3 w-3" />
          <span>Unknown</span>
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundAnimation />

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-4 sm:p-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white shadow-lg"
              >
                <Home className="h-8 w-8" />
              </motion.div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold gradient-text">
                  Smart Home D3IF
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">
                  ESP32 Dashboard & Pusat Kontrol
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {getConnectionBadge()}
              </motion.div>

              {/* Last seen indicator */}
              {connectionInfo.lastSeen > 0 && (
                <Badge variant="outline" className="flex items-center space-x-1 px-3 py-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {connectionInfo.status === 'online' ? 'Active' : `Last: ${connectionInfo.lastSeenFormatted}`}
                  </span>
                </Badge>
              )}

              {/* Weather API indicator */}
              {sensorData.isWeatherAPI && (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1 px-3 py-1"
                  >
                    <Cloud className="h-3 w-3" />
                    <span>Weather API</span>
                  </Badge>
                </motion.div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={Object.values(isLoading).some(Boolean)}
                className="bg-white/60 backdrop-blur-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    Object.values(isLoading).some(Boolean) ? "animate-spin" : ""
                  }`}
                />
              </Button>

              {/* Weather refresh button */}
              {sensorData.isWeatherAPI && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshWeatherData}
                  className="bg-white/60 backdrop-blur-sm"
                >
                  <Cloud className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-4 sm:px-6 mb-4"
          >
            <div className="max-w-7xl mx-auto">
              <Alert className="bg-red-100/80 backdrop-blur-sm border border-red-200">
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Info */}
      {connectionInfo.status === 'offline' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-4 sm:px-6 mb-4"
        >
          <div className="max-w-7xl mx-auto">
            <Alert className="bg-yellow-100/80 backdrop-blur-sm border border-yellow-200">
              <WifiOff className="h-5 w-5" />
              <AlertDescription className="text-yellow-700">
                ESP32 terputus sejak {connectionInfo.timeOffline} detik yang lalu. 
                Terakhir terlihat: {connectionInfo.lastSeenFormatted}. 
                Menggunakan data Weather API sebagai fallback.
              </AlertDescription>
            </Alert>
          </div>
        </motion.div>
      )}

      {/* Control Messages */}
      {controlMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-4 sm:px-6 mb-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-blue-100/80 backdrop-blur-sm border border-blue-200 rounded-lg p-3">
              <p className="text-blue-700 text-sm font-medium mb-2">Recent Commands:</p>
              <div className="space-y-1">
                {controlMessages.slice(0, 3).map((msg, idx) => (
                  <p key={`msg-${idx}-${msg.substring(0, 10)}`} className="text-blue-600 text-xs">{msg}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="relative z-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Sensor Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Activity className="mr-2 h-6 w-6" />
              Sensor Monitoring
              {connectionInfo.status === 'offline' && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  OFFLINE DATA
                </Badge>
              )}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SensorCard
                title="Suhu Ruang"
                value={
                  sensorData?.temperature != null
                    ? sensorData.temperature.toFixed(1)
                    : "N/A"
                }
                unit={sensorData?.temperature != null ? "°C" : ""}
                icon={sensorData.isWeatherAPI ? <Cloud className="h-5 w-5" /> : <Thermometer className="h-5 w-5" />}
                status={
                  sensorData?.temperature != null && sensorData.temperature > 30
                    ? "warning"
                    : "normal"
                }
                subtitle={
                  sensorData.isWeatherAPI 
                    ? "Weather API" 
                    : connectionInfo.status === 'offline' 
                      ? "DHT11 (Offline)" 
                      : "DHT11 Sensor"
                }
              />

              <SensorCard
                title="Kelembaban Udara"
                value={
                  sensorData?.humidity != null
                    ? sensorData.humidity.toFixed(1)
                    : "N/A"
                }
                unit={sensorData?.humidity != null ? "%" : ""}
                icon={sensorData.isWeatherAPI ? <Cloud className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                status={
                  sensorData?.humidity != null &&
                  (sensorData.humidity < 40 || sensorData.humidity > 70)
                    ? "warning"
                    : "normal"
                }
                subtitle={
                  sensorData.isWeatherAPI 
                    ? "Weather API" 
                    : connectionInfo.status === 'offline' 
                      ? "DHT11 (Offline)" 
                      : "DHT11 Sensor"
                }
              />

              <SensorCard
                title="Tingkat Cahaya"
                value={connectionInfo.status === 'offline' ? "--" : sensorData.lightLevel}
                icon={<Eye className="h-5 w-5" />}
                status={
                  connectionInfo.status === 'offline' 
                    ? "warning" 
                    : sensorData.isDark 
                      ? "active" 
                      : "normal"
                }
                subtitle={
                  connectionInfo.status === 'offline' 
                    ? "LDR (Offline)" 
                    : sensorData.isDark 
                      ? "Lingkungan Gelap" 
                      : "Lingkungan Terang"
                }
              />

              <SensorCard
                title="Jarak Terukur"
                value={
                  connectionInfo.status === 'offline' 
                    ? "--" 
                    : sensorData.distance > 0 
                      ? sensorData.distance 
                      : "--"
                }
                unit={
                  connectionInfo.status === 'offline' 
                    ? "" 
                    : sensorData.distance > 0 
                      ? " cm" 
                      : ""
                }
                icon={<Ruler className="h-5 w-5" />}
                status={
                  connectionInfo.status === 'offline' 
                    ? "warning" 
                    : sensorData.distance > 0 && sensorData.distance < 10
                      ? "warning"
                      : "normal"
                }
                subtitle={
                  connectionInfo.status === 'offline' 
                    ? "HC-SR04 (Offline)" 
                    : "HC-SR04 Ultrasonic"
                }
              />
            </div>
          </motion.section>

          {/* Motion & Joystick */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            <SensorCard
              title="Deteksi Gerakan"
              value={
                connectionInfo.status === 'offline' 
                  ? "OFFLINE" 
                  : sensorData.motionDetected 
                    ? "GERAKAN TERDETEKSI" 
                    : "TIDAK ADA GERAKAN"
              }
              icon={<Zap className="h-5 w-5" />}
              status={
                connectionInfo.status === 'offline' 
                  ? "warning" 
                  : sensorData.motionDetected 
                    ? "active" 
                    : "normal"
              }
              subtitle={
                connectionInfo.status === 'offline' 
                  ? "PIR Sensor (Offline)" 
                  : "PIR Sensor"
              }
            />

            <SensorCard
              title="Joystick"
              value={
                connectionInfo.status === 'offline' 
                  ? "OFFLINE" 
                  : sensorData.joystickPressed 
                    ? "DITEKAN" 
                    : "TIDAK DITEKAN"
              }
              icon={<GamepadIcon className="h-5 w-5" />}
              status={
                connectionInfo.status === 'offline' 
                  ? "warning" 
                  : sensorData.joystickPressed 
                    ? "active" 
                    : "normal"
              }
              subtitle={
                connectionInfo.status === 'offline' 
                  ? "Joystick (Offline)" 
                  : `X: ${sensorData.joyX} Y: ${sensorData.joyY}`
              }
            />
          </motion.section>

          {/* Control Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-1">
              <StatusIndicator
                status={systemStatus}
                isConnected={connectionInfo.isOnline}
                connectionInfo={connectionInfo}
              />
            </div>

            <div className="lg:col-span-1">
              <ControlPanel
                status={systemStatus}
                onLEDToggle={handleLEDToggle}
                onServoToggle={handleServoToggle}
                isLoading={{ led: isLoading.led, servo: isLoading.servo }}
                isConnected={connectionInfo.isOnline}
              />
            </div>

            <div className="lg:col-span-1">
              <RGBController
                currentMode={systemStatus.rgb.mode}
                onModeChange={handleRGBModeChange}
                isLoading={isLoading.rgb}
              />
            </div>
          </motion.section>

          {/* Footer Info */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-8"
          >
            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
              <p className="text-slate-600 mb-2">
                🚀 ESP32 Smart Home Dashboard
              </p>
              <p className="text-sm text-slate-500">
                Last updated:{" "}
                {isMounted
                  ? sensorData.timestamp
                    ? new Date(sensorData.timestamp * 1000).toLocaleTimeString()
                    : new Date().toLocaleTimeString()
                  : "Loading..."}
              </p>
              <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-slate-500">
                <span className={connectionInfo.isOnline ? "text-green-600" : "text-red-600"}>
                  📡 ESP32: {connectionInfo.status.toUpperCase()}
                </span>
                <span>📶 WiFi: {systemStatus.wifi.status}</span>
                <span>
                  ⏱️ Uptime:{" "}
                  {systemStatus.system.uptime
                    ? Math.floor(systemStatus.system.uptime / 1000)
                    : 0}
                  s
                </span>
                {systemStatus.wifi.ip && (
                  <span>🔗 {systemStatus.wifi.ip}</span>
                )}
                {sensorData.isWeatherAPI && (
                  <span className="text-blue-600">☁️ Weather API Active</span>
                )}
              </div>
              {connectionInfo.status === 'offline' && connectionInfo.timeOffline > 0 && (
                <div className="mt-2 text-xs text-red-500">
                  ⚠️ ESP32 offline for {connectionInfo.timeOffline} seconds
                </div>
              )}
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}