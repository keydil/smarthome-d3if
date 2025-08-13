// src/components/dashboard/StatusIndicator.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Zap, 
  Clock,
  Signal,
  Router
} from 'lucide-react';
import { SystemStatus } from '@/types';
import { formatUptime, getWiFiSignalStrength } from '@/lib/utils';

interface StatusIndicatorProps {
  status: SystemStatus;
  isConnected: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  isConnected
}) => {
  const signalStrength = getWiFiSignalStrength(status.wifi.rssi);
  
  return (
    <Card className="bg-white/60 backdrop-blur-md border-0 hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-slate-800">
          <Router className="h-5 w-5" />
          <span>System Status</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge variant={isConnected ? 'success' : 'destructive'}>
              {isConnected ? 'ONLINE' : 'OFFLINE'}
            </Badge>
          </motion.div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* WiFi Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">WiFi</span>
          </div>
          <div className="text-right">
            <Badge variant={status.wifi.status === 'Connected' ? 'success' : 'destructive'}>
              {status.wifi.status}
            </Badge>
            {status.wifi.ip && (
              <p className="text-xs text-slate-500 mt-1">{status.wifi.ip}</p>
            )}
          </div>
        </div>

        {/* Signal Strength */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            <Signal className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Signal</span>
          </div>
          <div className="text-right">
            <Badge variant={
              signalStrength === 'Excellent' ? 'success' :
              signalStrength === 'Good' ? 'info' :
              signalStrength === 'Fair' ? 'warning' : 'destructive'
            }>
              {signalStrength}
            </Badge>
            <p className="text-xs text-slate-500 mt-1">{status.wifi.rssi} dBm</p>
          </div>
        </div>

        {/* System Ready */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">System</span>
          </div>
          <Badge variant={status.system.ready ? 'success' : 'warning'}>
            {status.system.ready ? 'READY' : 'STARTING'}
          </Badge>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium">Uptime</span>
          </div>
          <motion.span 
            className="text-sm font-mono text-slate-600"
            key={status.system.uptime}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {formatUptime(status.system.uptime)}
          </motion.span>
        </div>

        {/* Connection Indicator */}
        <motion.div 
          className={`w-full h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </CardContent>
    </Card>
  );
};