// src/components/dashboard/RGBController.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Rainbow,
  Zap,
  Power,
  Loader2,
  WifiOff,
  AlertTriangle
} from 'lucide-react';

interface RGBControllerProps {
  currentMode: string;
  onModeChange: (mode: string) => Promise<void>;
  isLoading?: boolean;
  isConnected?: boolean; // NEW: Connection status
}

export const RGBController: React.FC<RGBControllerProps> = ({
  currentMode,
  onModeChange,
  isLoading = false,
  isConnected = true // Default to true for backward compatibility
}) => {
  const rgbModes = [
    { 
      name: 'OFF', 
      label: 'Off', 
      icon: Power, 
      color: 'bg-gray-500',
      description: 'Turn off RGB LED'
    },
    { 
      name: 'RED', 
      label: 'Red', 
      icon: Zap, 
      color: 'bg-red-500',
      description: 'Solid red color'
    },
    { 
      name: 'GREEN', 
      label: 'Green', 
      icon: Zap, 
      color: 'bg-green-500',
      description: 'Solid green color'
    },
    { 
      name: 'BLUE', 
      label: 'Blue', 
      icon: Zap, 
      color: 'bg-blue-500',
      description: 'Solid blue color'
    },
    { 
      name: 'RAINBOW', 
      label: 'Rainbow', 
      icon: Rainbow, 
      color: 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500',
      description: 'Cycling rainbow effect'
    },
    { 
      name: 'BREATHING', 
      label: 'Breathing', 
      icon: Palette, 
      color: 'bg-gradient-to-r from-purple-400 to-pink-400',
      description: 'Soft breathing effect'
    }
  ];

  const isControlsDisabled = !isConnected;

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
              variant={
                !isConnected ? 'secondary' :
                currentMode === 'OFF' ? 'secondary' : 'success'
              }
              className="flex items-center space-x-1"
            >
              <div className={`w-2 h-2 rounded-full ${
                !isConnected ? 'bg-gray-400' :
                currentMode === 'OFF' ? 'bg-gray-400' : 'bg-green-400 animate-pulse'
              }`} />
              <span>{!isConnected ? 'OFFLINE' : currentMode}</span>
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Offline Warning */}
        {!isConnected && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">ESP32 Offline</p>
              <p className="text-xs text-yellow-600 mt-1">
                RGB controls are disabled until ESP32 reconnects.
              </p>
            </div>
          </div>
        )}

        {/* Current Mode Display */}
        <div className="p-4 bg-slate-50/80 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Current Mode</span>
            <Badge variant={
              !isConnected ? 'secondary' :
              currentMode === 'OFF' ? 'secondary' : 'success'
            }>
              {!isConnected ? 'OFFLINE' : currentMode}
            </Badge>
          </div>
          
          {isConnected && currentMode !== 'OFF' && (
            <motion.div
              className={`h-3 rounded-full ${
                rgbModes.find(mode => mode.name === currentMode)?.color || 'bg-gray-300'
              }`}
              animate={{ 
                opacity: currentMode === 'BREATHING' ? [0.3, 1, 0.3] : 1,
                scale: currentMode === 'RAINBOW' ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                duration: currentMode === 'BREATHING' ? 2 : 1,
                repeat: currentMode === 'RAINBOW' || currentMode === 'BREATHING' 
                  ? Number.POSITIVE_INFINITY : 0 
              }}
            />
          )}
        </div>

        {/* Mode Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {rgbModes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.name;
            
            return (
              <motion.div key={mode.name} whileTap={!isControlsDisabled ? { scale: 0.95 } : {}}>
                <Button
                  variant={
                    isControlsDisabled ? "secondary" :
                    isActive ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => !isControlsDisabled && onModeChange(mode.name)}
                  disabled={isControlsDisabled || isLoading}
                  className={`w-full h-auto p-3 flex flex-col items-center space-y-2 relative overflow-hidden ${
                    isActive && !isControlsDisabled ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {isLoading && isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isControlsDisabled ? (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                  
                  <div className="text-center">
                    <p className="text-xs font-medium">{mode.label}</p>
                    <p className="text-[10px] text-muted-foreground opacity-70">
                      {isControlsDisabled ? 'Offline' : mode.description}
                    </p>
                  </div>

                  {/* Color preview bar */}
                  {!isControlsDisabled && mode.name !== 'OFF' && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${mode.color} ${
                      isActive ? 'opacity-100' : 'opacity-50'
                    }`} />
                  )}

                  {/* Active indicator animation */}
                  {isActive && !isControlsDisabled && mode.name !== 'OFF' && (
                    <motion.div
                      className="absolute inset-0 border-2 border-blue-500 rounded-md"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Manual Mode Info (if applicable) */}
        {isConnected && currentMode !== 'OFF' && (
          <div className="text-center">
            <p className="text-xs text-slate-500">
              🎨 RGB LED is currently in <span className="font-medium">{currentMode}</span> mode
            </p>
          </div>
        )}

        {/* Connection Status */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            } animate-pulse`} />
            <span className="text-xs text-slate-500">
              {isConnected ? 'RGB Controller Online' : 'RGB Controller Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};