# 🏠 Smart Home D3IF Dashboard

Sebuah dashboard smart home yang keren banget dengan tampilan futuristik, dibangun menggunakan Next.js 14, TypeScript, Tailwind CSS, Framer Motion, dan terintegrasi dengan ESP32!

## ✨ Features

### 🔥 Real-time Monitoring
- **Sensor Climate**: Suhu & Kelembaban (DHT11)
- **Environmental**: Light Level (LDR) & Distance (HC-SR04)
- **Input Detection**: Motion sensor (PIR) & Joystick control
- **Auto-refresh**: Data update setiap 2 detik

### 🎮 Smart Controls
- **LED Control**: On/Off built-in LED ESP32
- **Servo Motor**: Open/Close dengan animasi real-time
- **RGB Lighting**: 5 mode - Off, Red, Green, Blue, Rainbow
- **Real-time Feedback**: Status langsung update

### 🚀 Modern UI/UX
- **Glass Morphism**: Efek kaca modern dan elegan
- **Framer Motion**: Animasi smooth dan interaktif
- **Responsive Design**: Perfect di mobile & desktop
- **Dark Theme**: Futuristic dark mode
- **Neon Effects**: Glowing buttons dan indicators

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts (ready untuk future data visualization)
- **HTTP Client**: Fetch API dengan error handling
- **Hardware**: ESP32 dengan berbagai sensor

## 🚀 Quick Start

### 1. Setup Project

```bash
# Clone atau buat project baru
npx create-next-app@latest smart-home-d3if-dashboard --typescript --tailwind --app --src-dir --import-alias

# Masuk ke directory
cd smart-home-d3if-dashboard

# Install dependencies
npm install framer-motion lucide-react clsx tailwind-merge recharts axios
npm install @types/node @types/react @types/react-dom -D
```

### 2. Replace Files

Ganti file-file berikut dengan kode yang sudah disediakan:

- `src/app/page.tsx` - Main dashboard component
- `src/app/layout.tsx` - App layout with metadata
- `src/app/globals.css` - Styling dengan glass morphism
- `tailwind.config.js` - Konfigurasi Tailwind extended
- `package.json` - Dependencies lengkap

### 3. Setup ESP32 Connection

Edit `ESP32_IP` di file `src/app/page.tsx`:

```typescript
// CHANGE THIS TO YOUR ESP32 IP ADDRESS
const ESP32_IP = "192.168.1.100"; // Ganti dengan IP ESP32 lu
```

Cara cek IP ESP32:
1. Buka Serial Monitor Arduino IDE
2. Upload kode ESP32 yang lu punya
3. Lihat IP address yang muncul saat ESP32 connect ke WiFi
4. Update variable `ESP32_IP` di dashboard

### 4. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser lu!

## 📱 Responsive Design

Dashboard ini udah fully responsive bro:

### Mobile (< 640px)
- Single column layout
- Compressed sensor cards
- Touch-friendly buttons
- Optimized spacing

### Tablet (640px - 1024px)
- Two column layout
- Medium-sized cards
- Balanced information density

### Desktop (> 1024px)
- Three column layout
- Full feature display
- Detailed system info
- Maximum information density

## 🎨 UI Features

### Glass Morphism Effects
- **Backdrop blur**: Efek kaca transparan
- **Border highlights**: Subtle white borders
- **Shadow effects**: Layered shadows untuk depth
- **Gradient overlays**: Warna gradien yang smooth

### Animations & Interactions
- **Hover effects**: Scale dan glow pada buttons
- **Loading states**: Animated indicators
- **Status changes**: Smooth transitions
- **Real-time updates**: Animated counter numbers

### Color Coding
- 🔴 **Red**: Motion detected, errors, alerts
- 🟢 **Green**: Connected, servo moving, normal status
- 🔵 **Blue**: Dark mode, system info
- 🟡 **Yellow**: Light sensors, warnings
- 🟣 **Purple**: RGB modes, special states
- 🔵 **Cyan**: Primary actions, connections

## 🔌 API Integration

Dashboard terhubung ke ESP32 melalui REST API:

### GET Endpoints
```
GET /api/sensors     - Real-time sensor data
GET /api/status      - System status info
```

### POST Endpoints (Controls)
```
POST /api/control/led    - { "state": true/false }
POST /api/control/servo  - { "angle": 0-180 }
POST /api/control/rgb    - { "mode": "off|red|green|blue|rainbow" }
```

### Error Handling
- **Connection timeout**: Auto-retry mechanism
- **Network errors**: Graceful degradation
- **API errors**: User-friendly error messages
- **Offline mode**: Clear offline indicators

## 🚀 Advanced Features

### Real-time Status Indicators
- **Connection Status**: Online/Offline dengan animasi
- **System Ready**: ESP32 initialization status
- **Sensor States**: Live sensor value updates
- **Control Feedback**: Immediate response dari controls

### Performance Optimizations
- **Data caching**: Prevent unnecessary API calls
- **Debounced controls**: Prevent control spam
- **Optimized re-renders**: React optimization
- **Lazy loading**: Efficient component loading

### Accessibility
- **Keyboard navigation**: Full keyboard support
- **Focus indicators**: Clear focus states
- **Color contrast**: WCAG compliant colors
- **Screen reader friendly**: Semantic HTML

## 🔧 Customization

### Colors & Themes
Edit `tailwind.config.js` untuk custom colors:

```javascript
theme: {
  extend: {
    colors: {
      // Add your custom colors here
      'custom-cyan': '#your-color',
    }
  }
}
```

### API Configuration
Edit variabel `ESP32_IP` dan `API_BASE` di `page.tsx`:

```typescript
const ESP32_IP = "YOUR_ESP32_IP_HERE";
const API_BASE = `http://${ESP32_IP}`;
```

### Update Intervals
Adjust timing di `useEffect` hook:

```typescript
const interval = setInterval(fetchData, 2000); // 2 seconds
```

## 🐛 Troubleshooting

### Dashboard tidak connect ke ESP32
1. ✅ Pastikan ESP32 sudah running dan connect ke WiFi
2. ✅ Check IP address ESP32 di Serial Monitor
3. ✅ Update `ESP32_IP` variable di dashboard
4. ✅ Pastikan ESP32 dan laptop di network yang sama
5. ✅ Test API endpoint di browser: `http://ESP32_IP/api/sensors`

### Styling tidak muncul
1. ✅ Pastikan `tailwind.config.js` sudah benar
2. ✅ Check `globals.css` sudah import dengan benar
3. ✅ Restart development server: `npm run dev`

### Dependencies error
1. ✅ Delete `node_modules` dan `package-lock.json`
2. ✅ Run `npm install` lagi
3. ✅ Check Node.js version >= 18

## 📦 Production Build

```bash
# Build untuk production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
1. Push code ke GitHub
2. Connect repository di Netlify
3. Build command: `npm run build`
4. Publish directory: `.next`

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🎯 Future Enhancements

- [ ] **Data Visualization**: Charts untuk sensor history
- [ ] **Notifications**: Push notifications untuk alerts
- [ ] **Multi-device**: Support multiple ESP32 devices
- [ ] **User Authentication**: Login system
- [ ] **Settings Panel**: Customizable thresholds
- [ ] **Mobile App**: React Native version
- [ ] **Voice Control**: Integration dengan speech recognition
- [ ] **Smart Automation**: Rule-based automations

## 🤝 Contributing

Feel free untuk contribute bro! 

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
