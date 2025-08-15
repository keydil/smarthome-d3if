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
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Cloud,
  Clock,
  AlertCircle,
  Activity,
} from "lucide-react";

import { BackgroundAnimation } from "@/components/animations/BackgroundAnimation";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { RGBController } from "@/components/dashboard/RGBController";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

import { SmartHomeAPI } from "@/lib/api";
import type {
  SensorDataWithConnection,
  SystemStatusWithConnection,
  ConnectionInfo,
  APISensorResponse,
  APISystemResponse,
} from "@/types";

export default function HomePage() {
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
      status: "unknown",
      lastSeenFormatted: "Never",
      timeOffline: 0,
    },
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatusWithConnection>({
    servo: { open: false, moving: false },
    led: { builtin: false },
    rgb: { mode: "OFF", manualMode: false, manualTimeLeft: 0 },
    buzzer: { active: false },
    system: { ready: false, uptime: 0 },
    wifi: { status: "Disconnected", ip: "", rssi: 0 },
    timestamp: 0,
    connectionStatus: {
      isOnline: false,
      lastSeen: 0,
      timeDifference: 0,
      status: "unknown",
      lastSeenFormatted: "Never",
      timeOffline: 0,
    },
  });

//   const debounce = (func: Function, delay: number) => {
//   let timeoutId: NodeJS.Timeout;
//   return (...args: any[]) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func.apply(null, args), delay);
//   };
// };

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

    setControlMessages((prev) => [fullMessage, ...prev.slice(0, 4)]); // Keep last 5 messages

    if (isError) {
      setError(message);
    }
  };

  // Enhanced data fetching with connection status
  const fetchData = useCallback(async () => {
    try {
      const [sensors, status]: [APISensorResponse, APISystemResponse] =
        await Promise.all([
          SmartHomeAPI.getSensors(),
          SmartHomeAPI.getStatus(),
        ]);

      // Transform sensors data to match SensorDataWithConnection type
      const sensorConnectionStatus: ConnectionInfo = {
        isOnline: sensors.connectionStatus?.isOnline || false,
        lastSeen: sensors.connectionStatus?.lastSeen || 0,
        timeDifference: sensors.connectionStatus?.timeDifference || 0,
        status:
          (sensors.connectionStatus?.status as ConnectionInfo["status"]) ||
          "unknown",
        lastSeenFormatted:
          sensors.connectionStatus?.lastSeenFormatted || "Never",
        timeOffline: sensors.connectionStatus?.timeOffline || 0,
      };

      const transformedSensors: SensorDataWithConnection = {
        ...sensors,
        connectionStatus: sensorConnectionStatus,
      };

      // Transform status data to match SystemStatusWithConnection type
      const statusConnectionStatus: ConnectionInfo = {
        isOnline: status.connectionStatus?.isOnline || false,
        lastSeen: status.connectionStatus?.lastSeen || 0,
        timeDifference: status.connectionStatus?.timeDifference || 0,
        status:
          (status.connectionStatus?.status as ConnectionInfo["status"]) ||
          "unknown",
        lastSeenFormatted:
          status.connectionStatus?.lastSeenFormatted || "Never",
        timeOffline: status.connectionStatus?.timeOffline || 0,
      };

      const transformedStatus: SystemStatusWithConnection = {
        ...status,
        connectionStatus: statusConnectionStatus,
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
        status: "error",
        lastSeenFormatted: "Never",
        timeOffline: 0,
      };

      setSensorData((prev) => ({
        ...prev,
        connectionStatus: errorConnectionInfo,
      }));

      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: errorConnectionInfo,
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
        status: (connInfo.status as ConnectionInfo["status"]) || "unknown",
        lastSeenFormatted: connInfo.lastSeenFormatted || "Never",
        timeOffline: connInfo.timeOffline || 0,
      };

      // Update both sensor and system connection info
      setSensorData((prev) => ({
        ...prev,
        connectionStatus: fullConnectionInfo,
      }));

      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: fullConnectionInfo,
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
        status: "error",
        lastSeenFormatted: "Never",
        timeOffline: 0,
      };

      setSensorData((prev) => ({
        ...prev,
        connectionStatus: errorConnectionInfo,
      }));

      setSystemStatus((prev) => ({
        ...prev,
        connectionStatus: errorConnectionInfo,
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
  // 🚀 UPDATE UI DULU - INI KUNCINYA!
  setSystemStatus(prev => ({
    ...prev,
    rgb: { ...prev.rgb, mode }
  }));
  
  setIsLoading((prev) => ({ ...prev, rgb: true }));
  
  try {
    const result = await SmartHomeAPI.controlRGB(mode);
    
    if (result.success) {
      addControlMessage(result.message);
      // ✅ Skip fetchData() - UI sudah diupdate
    } else {
      // Rollback jika gagal
      addControlMessage(result.message, true);
      await fetchData(); // refresh untuk dapat state asli
    }
  } catch (err) {
    console.error("RGB control failed:", err);
    addControlMessage("RGB control failed", true);
    await fetchData(); // rollback
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
        // fetchData();
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
    if (connectionInfo.status === "online") {
      return (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Badge className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
            <Wifi className="h-4 w-4" />
            <span className="font-medium">Online</span>
          </Badge>
        </motion.div>
      );
    } else if (connectionInfo.status === "offline") {
      return (
        <Badge className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span className="font-medium">
            Offline {connectionInfo.timeOffline}s
          </span>
        </Badge>
      );
    } else {
      return (
        <Badge className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">Unknown</span>
        </Badge>
      );
    }
  };

  return (
    <div className="min-h-screen relative">
      <BackgroundAnimation />

      {/* Modern Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 p-3 sm:p-4 md:p-6"
      >
        <div className="w-full max-w-full mx-auto px-2 sm:px-4">
          <div className="glass rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl border border-white/20">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3 w-full lg:w-auto min-w-0">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="relative p-2 sm:p-3 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-600 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl logo-glow flex-shrink-0"
                >
                  <div className="bg-white/90 backdrop-blur-sm rounded-md sm:rounded-lg md:rounded-xl p-1.5 sm:p-2 md:p-3 premium-shadow">
                    <img
                      src="/android-chrome-512x512.png"
                      alt="Smart Home D3IF Logo"
                      className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 object-contain filter drop-shadow-2xl"
                      style={{
                        filter:
                          "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 20px rgba(0, 0, 0, 0.3))",
                      }}
                    />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 8,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-lg sm:rounded-xl md:rounded-2xl border-4 border-white/60"
                  />
                </motion.div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold relative elegant-underline"
                  >
                    <motion.span
                      className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 bg-clip-text text-transparent text-glow-green font-extrabold tracking-tight block sm:inline"
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      style={{ backgroundSize: "200% 200%" }}
                    >
                      Smart Home
                    </motion.span>
                    <motion.span
                      className="ml-0 sm:ml-2 md:ml-3 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 bg-clip-text text-transparent font-black tracking-widest block sm:inline"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                    >
                      D3IF
                    </motion.span>

                    {/* Elegant animated underline */}
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      transition={{ duration: 1.5, delay: 1 }}
                      className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 rounded-full shadow-lg"
                    />

                    {/* Luxury glow effect */}
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-green-400/20 blur-2xl -z-10 rounded-2xl"
                    />

                    {/* Sparkle effects */}
                    <motion.div
                      animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="absolute -top-2 -right-2 w-3 h-3 bg-gradient-to-r from-emerald-300 to-teal-300 rounded-full opacity-60"
                    />
                    <motion.div
                      animate={{
                        rotate: -360,
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                        delay: 1,
                      }}
                      className="absolute -bottom-1 left-1/4 w-2 h-2 bg-gradient-to-r from-teal-300 to-green-300 rounded-full opacity-50"
                    />
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-slate-600 text-sm sm:text-base md:text-lg font-semibold mt-2 sm:mt-3 mb-3 sm:mb-4 tracking-wide"
                  >
                    <span className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                      ESP32 Dashboard & Pusat Kontrol
                    </span>
                  </motion.p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 w-full lg:w-auto justify-start lg:justify-end">
                {getConnectionBadge()}

                {/* Enhanced Status Badges */}
                {connectionInfo.lastSeen > 0 && (
                  <Badge className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 text-xs sm:text-sm">
                    <Clock className="h-3 w-3" />
                    <span className="truncate">
                      {connectionInfo.status === "online"
                        ? "Active"
                        : `Last: ${connectionInfo.lastSeenFormatted}`}
                    </span>
                  </Badge>
                )}

                {sensorData.isWeatherAPI && (
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  >
                    <Badge className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs sm:text-sm">
                      <Cloud className="h-3 w-3" />
                      <span>Weather API</span>
                    </Badge>
                  </motion.div>
                )}

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchData}
                    disabled={Object.values(isLoading).some(Boolean)}
                    className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9 p-0"
                  >
                    <RefreshCw
                      className={`h-3 w-3 sm:h-4 sm:w-4 ${
                        Object.values(isLoading).some(Boolean)
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                  </Button>
                </motion.div>

                {sensorData.isWeatherAPI && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshWeatherData}
                      className="bg-white/80 backdrop-blur-sm border-white/30 hover:bg-white/90 transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      <Cloud className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Enhanced Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-3 sm:px-6 mb-4"
          >
            <div className="w-full max-w-full mx-auto px-2 sm:px-4">
              <Alert className="glass-green bg-emerald-600/40 backdrop-blur-xl border border-emerald-500/40 shadow-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <AlertDescription className="text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Info */}
      {connectionInfo.status === "offline" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-3 sm:px-6 mb-4"
        >
          <div className="w-full max-w-full mx-auto px-2 sm:px-4">
            <Alert className="glass bg-yellow-500/10 backdrop-blur-xl border border-yellow-200/30 shadow-xl">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <AlertDescription className="text-yellow-700 font-medium">
                ESP32 terputus sejak {connectionInfo.timeOffline} detik yang
                lalu. Terakhir terlihat: {connectionInfo.lastSeenFormatted}.
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
          className="relative z-10 px-3 sm:px-6 mb-4"
        >
          <div className="w-full max-w-full mx-auto px-2 sm:px-4">
            <div className="glass bg-blue-500/10 backdrop-blur-xl border border-blue-200/30 rounded-2xl p-4 shadow-xl">
              <p className="text-blue-700 font-semibold mb-3 flex items-center">
                <Activity className="mr-3 h-8 w-8 text-purple-600" />
                Recent Commands
              </p>
              <div className="space-y-2">
                {controlMessages.slice(0, 3).map((msg, idx) => (
                  <motion.p
                    key={`msg-${idx}-${msg.substring(0, 10)}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-blue-600 text-sm font-medium break-words"
                  >
                    {msg}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="relative z-10 p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-full mx-auto px-2 sm:px-4 space-y-6 sm:space-y-8">
          {/* Sensor Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-800 flex items-center">
                <Activity className="mr-3 h-8 w-8 text-purple-600" />
                Sensor Monitoring
              </h2>
              {connectionInfo.status === "offline" && (
                <Badge className="bg-red-500/10 text-red-700 border border-red-200">
                  OFFLINE DATA
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SensorCard
                title="Suhu Ruang"
                value={
                  sensorData?.temperature != null
                    ? sensorData.temperature.toFixed(1)
                    : "N/A"
                }
                unit={sensorData?.temperature != null ? "°C" : ""}
                icon={
                  sensorData.isWeatherAPI ? (
                    <Cloud className="h-5 w-5" />
                  ) : (
                    <Thermometer className="h-5 w-5" />
                  )
                }
                status={
                  sensorData?.temperature != null && sensorData.temperature > 30
                    ? "warning"
                    : "normal"
                }
                subtitle={
                  sensorData.isWeatherAPI
                    ? "Weather API"
                    : connectionInfo.status === "offline"
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
                icon={
                  sensorData.isWeatherAPI ? (
                    <Cloud className="h-5 w-5" />
                  ) : (
                    <Droplets className="h-5 w-5" />
                  )
                }
                status={
                  sensorData?.humidity != null &&
                  (sensorData.humidity < 40 || sensorData.humidity > 70)
                    ? "warning"
                    : "normal"
                }
                subtitle={
                  sensorData.isWeatherAPI
                    ? "Weather API"
                    : connectionInfo.status === "offline"
                    ? "DHT11 (Offline)"
                    : "DHT11 Sensor"
                }
              />

              <SensorCard
                title="Tingkat Cahaya"
                value={
                  connectionInfo.status === "offline"
                    ? "--"
                    : sensorData.lightLevel
                }
                icon={<Eye className="h-5 w-5" />}
                status={
                  connectionInfo.status === "offline"
                    ? "warning"
                    : sensorData.isDark
                    ? "active"
                    : "normal"
                }
                subtitle={
                  connectionInfo.status === "offline"
                    ? "LDR (Offline)"
                    : sensorData.isDark
                    ? "Lingkungan Gelap"
                    : "Lingkungan Terang"
                }
              />

              <SensorCard
                title="Jarak Terukur"
                value={
                  connectionInfo.status === "offline"
                    ? "--"
                    : sensorData.distance > 0
                    ? sensorData.distance
                    : "--"
                }
                unit={
                  connectionInfo.status === "offline"
                    ? ""
                    : sensorData.distance > 0
                    ? " cm"
                    : ""
                }
                icon={<Ruler className="h-5 w-5" />}
                status={
                  connectionInfo.status === "offline"
                    ? "warning"
                    : sensorData.distance > 0 && sensorData.distance < 10
                    ? "warning"
                    : "normal"
                }
                subtitle={
                  connectionInfo.status === "offline"
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
                connectionInfo.status === "offline"
                  ? "OFFLINE"
                  : sensorData.motionDetected
                  ? "GERAKAN TERDETEKSI"
                  : "TIDAK ADA GERAKAN"
              }
              icon={<Zap className="h-5 w-5" />}
              status={
                connectionInfo.status === "offline"
                  ? "warning"
                  : sensorData.motionDetected
                  ? "active"
                  : "normal"
              }
              subtitle={
                connectionInfo.status === "offline"
                  ? "PIR Sensor (Offline)"
                  : "PIR Sensor"
              }
            />

            <SensorCard
              title="Joystick"
              value={
                connectionInfo.status === "offline"
                  ? "OFFLINE"
                  : sensorData.joystickPressed
                  ? "DITEKAN"
                  : "TIDAK DITEKAN"
              }
              icon={<GamepadIcon className="h-5 w-5" />}
              status={
                connectionInfo.status === "offline"
                  ? "warning"
                  : sensorData.joystickPressed
                  ? "active"
                  : "normal"
              }
              subtitle={
                connectionInfo.status === "offline"
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
                isConnected={connectionInfo.isOnline}
              />
            </div>
          </motion.section>

          {/* Enhanced Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="py-8"
          >
            <div className="glass rounded-2xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  ESP32 Smart Home Dashboard
                </h3>
                <p className="text-slate-600 font-medium">
                  Rumah Pintar, Kendali di Tangan — Smart Control for Your Home
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-white/50 rounded-xl">
                  <div
                    className={`text-lg font-bold ${
                      connectionInfo.isOnline
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {connectionInfo.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-slate-600">ESP32 Status</div>
                </div>

                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="text-lg font-bold text-blue-600">
                    {systemStatus.wifi.status}
                  </div>
                  <div className="text-sm text-slate-600">WiFi Connection</div>
                </div>

                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="text-lg font-bold text-purple-600">
                    {systemStatus.system.uptime
                      ? Math.floor(systemStatus.system.uptime / 1000)
                      : 0}
                    s
                  </div>
                  <div className="text-sm text-slate-600">System Uptime</div>
                </div>

                <div className="p-4 bg-white/50 rounded-xl">
                  <div className="text-lg font-bold text-cyan-600">
                    {isMounted
                      ? sensorData.timestamp
                        ? new Date(
                            sensorData.timestamp * 1000
                          ).toLocaleTimeString()
                        : new Date().toLocaleTimeString()
                      : "Loading..."}
                  </div>
                  <div className="text-sm text-slate-600">Last Update</div>
                </div>
              </div>

              {/* {systemStatus.wifi.ip && (
                <div className="mt-4 text-center">
                  <Badge className="bg-slate-100 text-slate-700 px-3 py-1">
                    🔗 {systemStatus.wifi.ip}
                  </Badge>
                </div>
              )} */}

              <div className="flex justify-center items-center py-2">
                <AnimatedShinyText className="inline-flex items-center gap-2 px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                  <a
                    href="https://github.com/keydil"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 underline underline-offset-4"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.1c-3.2.7-3.9-1.4-3.9-1.4-.5-1.2-1.1-1.6-1.1-1.6-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.5 1.1 3.1.8.1-.7.4-1.1.7-1.4-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.4 1.1-3.3-.1-.3-.5-1.5.1-3.1 0 0 .9-.3 3.4 1.2 1-.3 2.1-.5 3.1-.5 1.1 0 2.1.2 3.1.5 2.5-1.5 3.4-1.2 3.4-1.2.6 1.6.2 2.8.1 3.1.7.9 1.1 2 1.1 3.3 0 4.5-2.7 5.5-5.3 5.8.4.3.7.9.7 1.8v2.6c0 .3.2.7.8.6C20.7 21.4 24 17.1 24 12 24 5.65 18.35.5 12 .5z" />
                    </svg>
                    Created by Udil
                  </a>
                </AnimatedShinyText>
              </div>
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}
