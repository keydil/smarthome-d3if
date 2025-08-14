"use client"
import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Rainbow, Zap, Power, Loader2, WifiOff, AlertTriangle, Check } from "lucide-react"

interface RGBControllerProps {
  currentMode: string
  onModeChange: (mode: string) => Promise<void>
  isLoading?: boolean
  isConnected?: boolean
}

export const RGBController: React.FC<RGBControllerProps> = ({
  currentMode,
  onModeChange,
  isLoading = false,
  isConnected = true,
}) => {
  const rgbModes = [
    {
      name: "OFF",
      label: "Off",
      icon: Power,
      description: "Turn off RGB LED",
      activeClass: "bg-gray-700 text-white border-gray-700",
      inactiveClass: "bg-white hover:bg-gray-50 text-gray-700 border-gray-200",
      colorBar: "bg-gray-500",
    },
    {
      name: "RED",
      label: "Red",
      icon: Zap,
      description: "Solid red color",
      activeClass: "bg-red-500 text-white border-red-500 shadow-red-200",
      inactiveClass: "bg-white hover:bg-red-50 text-gray-700 border-gray-200",
      colorBar: "bg-red-500",
    },
    {
      name: "GREEN",
      label: "Green",
      icon: Zap,
      description: "Solid green color",
      activeClass: "bg-green-500 text-white border-green-500 shadow-green-200",
      inactiveClass: "bg-white hover:bg-green-50 text-gray-700 border-gray-200",
      colorBar: "bg-green-500",
    },
    {
      name: "BLUE",
      label: "Blue",
      icon: Zap,
      description: "Solid blue color",
      activeClass: "bg-blue-500 text-white border-blue-500 shadow-blue-200",
      inactiveClass: "bg-white hover:bg-blue-50 text-gray-700 border-gray-200",
      colorBar: "bg-blue-500",
    },
    {
      name: "RAINBOW",
      label: "Rainbow",
      icon: Rainbow,
      description: "Cycling rainbow effect",
      activeClass:
        "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white border-purple-500 shadow-purple-200",
      inactiveClass: "bg-white hover:bg-purple-50 text-gray-700 border-gray-200",
      colorBar: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
    },
    {
      name: "BREATHING",
      label: "Breathing",
      icon: Palette,
      description: "Soft breathing effect",
      activeClass: "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-500 shadow-pink-200",
      inactiveClass: "bg-white hover:bg-purple-50 text-gray-700 border-gray-200",
      colorBar: "bg-gradient-to-r from-purple-400 to-pink-400",
    },
  ]

  const isControlsDisabled = !isConnected

  return (
    <Card className="bg-white/60 backdrop-blur-md border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-800">
          <Palette className="h-5 w-5" />
          <span>RGB Controller</span>
          <div className="ml-auto flex items-center space-x-2">
            {!isConnected && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <WifiOff className="h-3 w-3" />
                <span>OFFLINE</span>
              </Badge>
            )}
            <Badge
              variant="outline"
              className={`flex items-center space-x-2 px-3 py-1 ${
                !isConnected
                  ? "bg-red-50 border-red-200 text-red-700"
                  : currentMode === "OFF"
                    ? "bg-gray-50 border-gray-200 text-gray-700"
                    : "bg-green-50 border-green-200 text-green-700"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  !isConnected ? "bg-red-400" : currentMode === "OFF" ? "bg-gray-400" : "bg-green-400 animate-pulse"
                }`}
              />
              <span
                className={`font-medium px-2 py-1 rounded text-xs ${
                  !isConnected
                    ? "bg-red-100 text-red-800"
                    : currentMode === "OFF"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                }`}
              >
                {!isConnected ? "OFFLINE" : currentMode}
              </span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">ESP32 Offline</p>
              <p className="text-xs text-yellow-600 mt-1">RGB controls are disabled until ESP32 reconnects.</p>
            </div>
          </div>
        )}

        <div className="p-4 bg-slate-50/80 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Current Mode</span>
            <Badge variant={isConnected ? (currentMode === "OFF" ? "secondary" : "default") : "secondary"}>
              {isConnected ? currentMode : "OFFLINE"}
            </Badge>
          </div>

          {isConnected && currentMode !== "OFF" && (
            <div
              className={`h-3 rounded-full ${
                rgbModes.find(
                  (mode) =>
                    currentMode === mode.name ||
                    (mode.name === "RAINBOW" && currentMode.startsWith("RAINBOW")) ||
                    (mode.name === "BREATHING" && currentMode.startsWith("BREATHING")) ||
                    (mode.name === "GREEN" && currentMode.startsWith("GREEN")) ||
                    (mode.name === "RED" && currentMode.startsWith("RED")) ||
                    (mode.name === "BLUE" && currentMode.startsWith("BLUE")),
                )?.colorBar || "bg-gray-300"
              }`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {rgbModes.map((mode) => {
            const Icon = mode.icon
            const isActive =
              currentMode === mode.name ||
              currentMode.startsWith(mode.name + "_") ||
              (mode.name === "RAINBOW" && currentMode.startsWith("RAINBOW")) ||
              (mode.name === "BREATHING" && currentMode.startsWith("BREATHING"))

            return (
              <div key={mode.name} className="relative">
                <div
                  onClick={() => !isControlsDisabled && onModeChange(mode.name)}
                  className={`w-full h-auto p-4 flex flex-col items-center space-y-2 relative transition-all duration-200 border-2 rounded-md cursor-pointer ${
                    isControlsDisabled
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : isActive
                        ? `${mode.activeClass} shadow-xl transform scale-105 ring-4 ring-opacity-30 ${
                            mode.name === "GREEN"
                              ? "ring-green-300"
                              : mode.name === "RED"
                                ? "ring-red-300"
                                : mode.name === "BLUE"
                                  ? "ring-blue-300"
                                  : mode.name === "RAINBOW"
                                    ? "ring-purple-300"
                                    : mode.name === "BREATHING"
                                      ? "ring-pink-300"
                                      : "ring-gray-300"
                          }`
                        : mode.inactiveClass
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {isLoading && isActive ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isControlsDisabled ? (
                      <WifiOff className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}

                    <div className="text-center">
                      <p className="text-sm font-bold">{mode.label}</p>
                      <p className="text-xs opacity-70">{isControlsDisabled ? "Offline" : mode.description}</p>
                    </div>
                  </div>

                  {!isControlsDisabled && mode.name !== "OFF" && (
                    <div className={`absolute bottom-0 left-0 right-0 h-2 ${mode.colorBar} rounded-b-md`} />
                  )}
                </div>

                {isActive && !isControlsDisabled && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-xl z-10">
                    <Check className="h-4 w-4 text-white font-bold" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {isConnected && currentMode !== "OFF" && (
          <div className="text-center">
            <p className="text-xs text-slate-500">
              🎨 RGB LED is currently in <span className="font-medium">{currentMode}</span> mode
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
            <span className="text-xs text-slate-500">
              {isConnected ? "RGB Controller Online" : "RGB Controller Offline"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
