// src/components/dashboard/ControlPanel.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  DoorOpen, 
  DoorClosed, 
  Settings,
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';
import { SystemStatus } from '@/types';

interface ControlPanelProps {
  status: SystemStatus;
  onLEDToggle: () => void;
  onServoToggle: () => void;
  isLoading?: {
    led: boolean;
    servo: boolean;
  };
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  onLEDToggle,
  onServoToggle,
  isLoading = { led: false, servo: false }
}) => {
  return (
    <Card className="bg-white/60 backdrop-blur-md border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-800">
          <Settings className="h-5 w-5" />
          <span>Control Panel</span>
          <Badge variant="info" className="ml-auto">
            MANUAL
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* LED Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb className={`h-5 w-5 ${status.led.builtin ? 'text-yellow-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-slate-700">Built-in LED</span>
            </div>
            <Badge variant={status.led.builtin ? 'success' : 'secondary'}>
              {status.led.builtin ? 'ON' : 'OFF'}
            </Badge>
          </div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={status.led.builtin ? "destructive" : "gradient"}
              size="lg"
              onClick={onLEDToggle}
              disabled={isLoading.led}
              className="w-full relative overflow-hidden"
            >
              {isLoading.led ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <motion.div
                    animate={status.led.builtin ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Lightbulb className="mr-2 h-4 w-4" />
                  </motion.div>
                  {status.led.builtin ? 'Turn OFF' : 'Turn ON'}
                </>
              )}
              
              {/* Glow effect when LED is on */}
              {status.led.builtin && (
                <motion.div
                  className="absolute inset-0 bg-yellow-300/20 rounded-md"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Servo Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status.servo.open ? (
                <DoorOpen className="h-5 w-5 text-green-600" />
              ) : (
                <DoorClosed className="h-5 w-5 text-blue-600" />
              )}
              <span className="text-sm font-medium text-slate-700">Door Servo</span>
            </div>
            <div className="flex items-center space-x-2">
              {status.servo.moving && (
                <Badge variant="warning" className="animate-pulse">
                  MOVING
                </Badge>
              )}
              <Badge variant={status.servo.open ? 'success' : 'info'}>
                {status.servo.open ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>
          </div>
          
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant={status.servo.open ? "outline" : "gradient"}
              size="lg"
              onClick={onServoToggle}
              disabled={isLoading.servo || status.servo.moving}
              className="w-full relative overflow-hidden"
            >
              {isLoading.servo || status.servo.moving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {status.servo.moving ? 'Moving...' : 'Updating...'}
                </>
              ) : (
                <>
                  <motion.div
                    animate={status.servo.moving ? { rotate: 180 } : {}}
                    transition={{ duration: 0.8 }}
                  >
                    {status.servo.open ? (
                      <DoorClosed className="mr-2 h-4 w-4" />
                    ) : (
                      <DoorOpen className="mr-2 h-4 w-4" />
                    )}
                  </motion.div>
                  {status.servo.open ? 'Close Door' : 'Open Door'}
                </>
              )}
            </Button>
          </motion.div>
        </div>

        {/* Buzzer Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            {status.buzzer.active ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Volume2 className="h-4 w-4 text-red-600" />
              </motion.div>
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium text-slate-700">Motion Buzzer</span>
          </div>
          <Badge variant={status.buzzer.active ? 'destructive' : 'secondary'}>
            {status.buzzer.active ? 'ACTIVE' : 'SILENT'}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onLEDToggle();
                onServoToggle();
              }}
              disabled={isLoading.led || isLoading.servo || status.servo.moving}
              className="text-xs"
            >
              Toggle All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};