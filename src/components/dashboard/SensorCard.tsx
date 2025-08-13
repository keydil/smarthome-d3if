// src/components/dashboard/SensorCard.tsx
'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Eye, 
  Ruler, 
  Zap,
  GamepadIcon
} from 'lucide-react';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'danger' | 'active';
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

const statusColors = {
  normal: 'success',
  warning: 'warning', 
  danger: 'destructive',
  active: 'info'
} as const;

export const SensorCard: React.FC<SensorCardProps> = ({
  title,
  value,
  unit,
  icon,
  status = 'normal',
  trend,
  subtitle
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="relative overflow-hidden group hover:shadow-2xl border-0 bg-white/60 backdrop-blur-md">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100"
          transition={{ duration: 0.3 }}
        />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            {title}
          </CardTitle>
          <motion.div 
            className="text-slate-600"
            animate={{ rotate: status === 'active' ? 360 : 0 }}
            transition={{ duration: 2, repeat: status === 'active' ? Infinity : 0 }}
          >
            {icon}
          </motion.div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <motion.div 
                className="text-2xl font-bold text-slate-800"
                key={value}
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {value}{unit}
              </motion.div>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <Badge variant={statusColors[status]} className="text-xs">
                {status.toUpperCase()}
              </Badge>
              
              {trend && (
                <motion.div
                  className={`text-xs ${
                    trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 'text-slate-500'
                  }`}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
        
        {/* Shimmer Effect */}
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ translateX: ['100%', '100%', '-100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </Card>
    </motion.div>
  );
};