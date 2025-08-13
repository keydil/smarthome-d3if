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
  Cpu,
} from "lucide-react";

import { BackgroundAnimation } from "@/components/animations/BackgroundAnimation";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { ControlPanel } from "@/components/dashboard/ControlPanel";
import { StatusIndicator } from "@/components/dashboard/StatusIndicator";
import { RGBController } from "@/components/dashboard/RGBController";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { SmartHomeAPI } from "@/lib/api";
import type { SensorData, SystemStatus } from "@/types";

export default function HomePage() {
  const [sensorData, setSensorData] = useState<SensorData>({
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
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    servo: { open: false, moving: false },
    led: { builtin: false },
    rgb: { mode: "OFF" },
    buzzer: { active: false },
    system: { ready: false, uptime: 0 },
    wifi: { status: "Disconnected", ip: "", rssi: 0 },
    timestamp: 0,
  });

  const [isMounted, setIsMounted] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState({
    led: false,
    servo: false,
    rgb: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Data fetching
  const fetchData = useCallback(async () => {
    try {
      const [sensors, status] = await Promise.all([
        SmartHomeAPI.getSensors(),
        SmartHomeAPI.getStatus(),
      ]);

      setSensorData(sensors);
      setSystemStatus(status);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setIsConnected(false);
      setError("Failed to connect to ESP32");
    }
  }, []);

  // Connection check
  const checkConnection = useCallback(async () => {
    try {
      const connected = await SmartHomeAPI.checkConnection();
      setIsConnected(connected);
      if (!connected) {
        setError("ESP32 not reachable");
      }
    } catch (err) {
      setIsConnected(false);
      setError("Connection check failed");
    }
  }, []);

  // Manual weather refresh
  const refreshWeatherData = async () => {
    try {
      await SmartHomeAPI.refreshWeatherData();
      await fetchData();
    } catch (err) {
      console.error("Failed to refresh weather data:", err);
    }
  };

  // Control functions
  const handleLEDToggle = async () => {
    setIsLoading((prev) => ({ ...prev, led: true }));
    try {
      await SmartHomeAPI.controlLED(!systemStatus.led.builtin);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("LED control failed:", err);
      setError("Failed to control LED");
    } finally {
      setIsLoading((prev) => ({ ...prev, led: false }));
    }
  };

  const handleServoToggle = async () => {
    setIsLoading((prev) => ({ ...prev, servo: true }));
    try {
      const newAngle = systemStatus.servo.open ? 90 : 0;
      await SmartHomeAPI.controlServo(newAngle);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Servo control failed:", err);
      setError("Failed to control servo");
    } finally {
      setIsLoading((prev) => ({ ...prev, servo: false }));
    }
  };

  const handleRGBModeChange = async (mode: string) => {
    setIsLoading((prev) => ({ ...prev, rgb: true }));
    try {
      await SmartHomeAPI.controlRGB(mode);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("RGB control failed:", err);
      setError("Failed to control RGB");
    } finally {
      setIsLoading((prev) => ({ ...prev, rgb: false }));
    }
  };

  // Effects
  useEffect(() => {
    checkConnection();
    fetchData();

    const interval = setInterval(() => {
      if (isConnected) {
        fetchData();
      } else {
        checkConnection();
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [checkConnection, fetchData, isConnected]);

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
                <Badge
                  variant={isConnected ? "success" : "destructive"}
                  className="flex items-center space-x-1 px-3 py-1"
                >
                  {isConnected ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  <span>{isConnected ? "Online" : "Offline"}</span>
                </Badge>
              </motion.div>

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
            className="relative z-10 px-4 sm:px-6"
          >
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-100/80 backdrop-blur-sm border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                subtitle={sensorData.isWeatherAPI ? "Weather API" : "DHT11 Sensor"}
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
                subtitle={sensorData.isWeatherAPI ? "Weather API" : "DHT11 Sensor"}
              />

              <SensorCard
                title="Tingkat Cahaya"
                value={sensorData.lightLevel}
                icon={<Eye className="h-5 w-5" />}
                status={sensorData.isDark ? "active" : "normal"}
                subtitle={
                  sensorData.isDark ? "Lingkungan Gelap" : "Lingkungan Terang"
                }
              />

              <SensorCard
                title="Jarak Terukur"
                value={sensorData.distance > 0 ? sensorData.distance : "--"}
                unit={sensorData.distance > 0 ? " cm" : ""}
                icon={<Ruler className="h-5 w-5" />}
                status={
                  sensorData.distance > 0 && sensorData.distance < 10
                    ? "warning"
                    : "normal"
                }
                subtitle="HC-SR04 Ultrasonic"
              />
            </div>
          </motion.section>

          {/* Motion & Joystick */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-2 gap-6"
          >
            <SensorCard
              title="Deteksi Gerakan"
              value={sensorData.motionDetected ? "GERAKAN TERDETEKSI" : "TIDAK ADA GERAKAN"}
              icon={<Zap className="h-5 w-5" />}
              status={sensorData.motionDetected ? "active" : "normal"}
              subtitle="PIR Sensor"
            />

            <SensorCard
              title="Joystick"
              value={sensorData.joystickPressed ? "DITEKAN" : "TIDAK DITEKAN"}
              icon={<GamepadIcon className="h-5 w-5" />}
              status={sensorData.joystickPressed ? "active" : "normal"}
              subtitle={`X: ${sensorData.joyX} Y: ${sensorData.joyY}`}
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
                isConnected={isConnected}
              />
            </div>

            <div className="lg:col-span-1">
              <ControlPanel
                status={systemStatus}
                onLEDToggle={handleLEDToggle}
                onServoToggle={handleServoToggle}
                isLoading={{ led: isLoading.led, servo: isLoading.servo }}
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
                <span>📡 WiFi: {systemStatus.wifi.status}</span>
                <span>
                  ⏱️ Uptime:{" "}
                  {systemStatus.system.uptime
                    ? Math.floor(systemStatus.system.uptime)
                    : 0}
                  s
                </span>
                <span>🔗 {systemStatus.wifi.ip}</span>
                {sensorData.isWeatherAPI && (
                  <span className="text-blue-600">☁️ Weather API Active</span>
                )}
              </div>
            </div>
          </motion.footer>
        </div>
      </main>
    </div>
  );
}