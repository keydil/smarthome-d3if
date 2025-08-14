// src/components/dashboard/StatusIndicator.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff,
  Zap, 
  Clock,
  Signal,
  Router,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { SystemStatus, ConnectionInfo } from '@/types';
import { formatUptime, getWiFiSignalStrength } from '@/lib/utils';

interface StatusIndicatorProps {
  status: SystemStatus;
  isConnected: boolean;
  connectionInfo?: ConnectionInfo; // Optional untuk backward compatibility
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  isConnected,
  connectionInfo
}) => {
  const signalStrength = getWiFiSignalStrength(status.wifi.rssi);
  
  // Determine connection status
  const getConnectionStatus = () => {
    if (connectionInfo) {
      switch (connectionInfo.status) {
        case 'online':
          return { 
            variant: 'success' as const, 
            text: 'ONLINE',
            icon: <CheckCircle className="h-3 w-3" />
          };
        case 'offline':
          return { 
            variant: 'destructive' as const, 
            text: `OFFLINE (${connectionInfo.timeOffline}s)`,
            icon: <AlertCircle className="h-3 w-3" />
          };
        default:
          return { 
            variant: 'secondary' as const, 
            text: 'UNKNOWN',
            icon: <AlertCircle className="h-3 w-3" />
          };
      }
    }
    return { 
      variant: isConnected ? 'success' as const : 'destructive' as const, 
      text: isConnected ? 'ONLINE' : 'OFFLINE',
      icon: isConnected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />
    };
  };

  const connectionStatus = getConnectionStatus();
  
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
            <Badge variant={connectionStatus.variant} className="flex items-center space-x-1">
              {connectionStatus.icon}
              <span>{connectionStatus.text}</span>
            </Badge>
          </motion.div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ESP32 Connection Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">ESP32</span>
          </div>
          <div className="text-right">
            <Badge variant={isConnected ? 'success' : 'destructive'}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </Badge>
            {connectionInfo && connectionInfo.lastSeen > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {isConnected 
                  ? 'Active now' 
                  : `Last seen: ${connectionInfo.lastSeenFormatted}`
                }
              </p>
            )}
          </div>
        </div>

        {/* WiFi Status */}
        <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg">
          <div className="flex items-center space-x-2">
            {status.wifi.status === 'Connected' || status.wifi.status === 'Online' ? (
              <Wifi className="h-4 w-4 text-blue-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm font-medium">WiFi</span>
          </div>
          <div className="text-right">
            <Badge variant={
              status.wifi.status === 'Connected' || status.wifi.status === 'Online' 
                ? 'success' 
                : 'destructive'
            }>
              {status.wifi.status || 'Unknown'}
            </Badge>
            {status.wifi.ip && (
              <p className="text-xs text-slate-500 mt-1">{status.wifi.ip}</p>
            )}
          </div>
        </div>

        {/* Signal Strength - Only show if connected */}
        {(status.wifi.status === 'Connected' || status.wifi.status === 'Online') && status.wifi.rssi !== 0 && (
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
        )}

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
            {isConnected ? formatUptime(status.system.uptime) : '0s'}
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

        {/* Offline Warning */}
        {!isConnected && connectionInfo && connectionInfo.timeOffline > 30 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600 text-center">
              ⚠️ ESP32 has been offline for {connectionInfo.timeOffline} seconds
            </p>
            {connectionInfo.lastSeenFormatted !== 'Never' && (
              <p className="text-xs text-red-500 text-center mt-1">
                Last active: {connectionInfo.lastSeenFormatted}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};