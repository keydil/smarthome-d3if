// src/components/dashboard/RGBController.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Circle } from 'lucide-react';

interface RGBControllerProps {
  currentMode: string;
  onModeChange: (mode: string) => void;
  isLoading?: boolean;
}

const rgbModes = [
  { value: 'off', label: 'OFF', color: 'bg-gray-400', textColor: 'text-gray-600' },
  { value: 'red', label: 'RED', color: 'bg-red-500', textColor: 'text-red-600' },
  { value: 'green', label: 'GREEN', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'blue', label: 'BLUE', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'rainbow', label: 'RAINBOW', color: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500', textColor: 'text-purple-600' },
];

export const RGBController: React.FC<RGBControllerProps> = ({
  currentMode,
  onModeChange,
  isLoading = false
}) => {
  const currentModeData = rgbModes.find(mode => mode.value === currentMode.toLowerCase()) || rgbModes[0];

  return (
    <Card className="bg-white/60 backdrop-blur-md border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-800">
          <Palette className="h-5 w-5" />
          <span>RGB Controller</span>
          <Badge variant="gradient" className="ml-auto">
            {currentModeData.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Mode Display */}
        <div className="flex items-center justify-center space-x-4 p-4 bg-slate-50/80 rounded-lg">
          <motion.div
            className={`w-12 h-12 rounded-full ${currentModeData.color} shadow-lg`}
            animate={{ 
              scale: currentMode.toLowerCase() === 'rainbow' ? [1, 1.1, 1] : 1,
              rotate: currentMode.toLowerCase() === 'rainbow' ? 360 : 0
            }}
            transition={{ 
              duration: currentMode.toLowerCase() === 'rainbow' ? 2 : 0.3,
              repeat: currentMode.toLowerCase() === 'rainbow' ? Infinity : 0
            }}
          />
          <div>
            <p className="text-sm font-medium text-slate-600">Mode Saat Ini</p>
            <p className={`text-lg font-bold ${currentModeData.textColor}`}>
              {currentModeData.label}
            </p>
          </div>
        </div>

        {/* Mode Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rgbModes.map((mode, index) => (
            <motion.div
              key={mode.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant={currentMode.toLowerCase() === mode.value ? "gradient" : "outline"}
                size="sm"
                onClick={() => onModeChange(mode.value)}
                disabled={isLoading}
                className="w-full h-auto p-3 flex flex-col items-center space-y-2 group hover:scale-105 transition-all"
              >
                <motion.div
                  className={`w-6 h-6 rounded-full ${mode.color} shadow-md`}
                  whileHover={{ scale: 1.2 }}
                  animate={mode.value === 'rainbow' ? {
                    rotate: 360
                  } : {}}
                  transition={mode.value === 'rainbow' ? {
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  } : {}}
                />
                <span className="text-xs font-medium">{mode.label}</span>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Status Indicator */}
        <motion.div 
          className="flex items-center justify-center space-x-2 text-sm text-slate-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Circle className={`h-3 w-3 fill-current ${
            isLoading ? 'text-yellow-500' : 'text-green-500'
          }`} />
          <span>{isLoading ? 'Updating...' : 'Ready'}</span>
        </motion.div>
      </CardContent>
    </Card>
  );
};