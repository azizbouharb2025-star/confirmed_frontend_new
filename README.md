# 🚀 Confirmed - AI-Powered Order Confirmation Platform

<div align="center">

![Confirmed Logo](https://img.shields.io/badge/Confirmed-AI%20Platform-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Revolutionary AI-powered order confirmation platform with stunning UI/UX**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Screenshots](#-screenshots) • [API Docs](#-api-documentation)

</div>

---

## ✨ Features

### 🎨 **Ultra-Modern UI/UX**
- **Glassmorphism Design** - Frosted glass effects with backdrop blur
- **Smooth 60fps Animations** - Powered by Framer Motion
- **Particle Background** - Interactive canvas-based particle system
- **Gradient Animations** - Dynamic color-shifting text and elements
- **Micro-interactions** - Delightful hover states and transitions

### 🌍 **Multi-Language Support**
- **3 Languages**: English, French, Arabic
- **RTL Support** - Full right-to-left layout for Arabic
- **Persistent Settings** - Language preferences saved across sessions
- **Animated Switcher** - Beautiful flag-based language selector

### 🌙 **Dark/Light Mode**
- **Complete Theme System** - Every component supports both modes
- **Smooth Transitions** - Animated theme switching
- **Persistent Theme** - User preference saved in localStorage
- **Optimized Contrast** - Perfect readability in both modes

### 🔐 **Role-Based Access Control**
- **3 User Roles**: Admin, Operator, Shop Owner
- **Protected Routes** - Automatic role-based redirects
- **Secure Authentication** - JWT token-based auth with Zustand
- **Session Management** - Persistent login across page refreshes

### 📊 **Advanced Dashboards**

#### **Admin Dashboard**
- System-wide analytics and metrics
- User management overview
- Revenue and performance tracking
- Real-time activity feed
- System health monitoring

#### **Operator Dashboard**
- Live call queue with priority indicators
- Performance metrics and rankings
- Real-time order assignments
- Call efficiency tracking
- Today's performance charts

#### **Shop Owner Dashboard**
- Store performance metrics
- Order management with status tracking
- Revenue analytics and trends
- Real-time order updates
- Shipping and delivery tracking

### 🎯 **Key Capabilities**
- **Real-time Updates** - Live data streaming with WebSocket support
- **Animated Counters** - Smooth number increment animations
- **Interactive Charts** - Ready for Recharts/D3.js integration
- **Responsive Design** - Perfect on mobile, tablet, and desktop
- **Accessibility** - WCAG 2.1 AA compliant
- **Performance** - Optimized bundle size and lazy loading

---

## 🛠️ Tech Stack

### **Frontend Framework**
- **Next.js 14** - React framework with App Router
- **React 18.2** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### **Styling & Animation**
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 10** - Production-ready animation library
- **Custom CSS** - Glassmorphism and advanced effects

### **State Management**
- **Zustand 4.4** - Lightweight state management
- **React Query 5** - Server state management
- **Persistent Storage** - localStorage integration

### **UI Components**
- **Headless UI** - Accessible component primitives
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Lucide React** - Additional icon library

### **Data Visualization**
- **Recharts 2.8** - Composable charting library
- **React CountUp** - Animated number counters

### **Development Tools**
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18.20.8 or higher
- npm or yarn package manager
- Backend API running on port 3000

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/confirmed.git
cd confirmed
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
# Backend API should be running on http://localhost:3000
# Frontend will proxy API requests through Next.js
```

4. **Start development server**
```bash
npm run dev
```

5. **Open your browser**
```
http://localhost:3001
```

### **Build for Production**
```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
Confirmed V1/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles with animations
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Landing page
│   └── panel/                   # Dashboard routes
│       ├── login/               # Login page
│       ├── register/            # Registration page
│       ├── forgot-password/     # Password reset
│       ├── admin/               # Admin dashboard
│       ├── op/                  # Operator dashboard
│       └── client/              # Shop owner dashboard
│
├── components/                   # React components
│   ├── auth/                    # Auth components
│   │   └── ProtectedRoute.tsx  # Role-based route protection
│   ├── dashboard/               # Dashboard components
│   │   ├── DashboardLayout.tsx # Main dashboard layout
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── MetricCard.tsx      # Animated metric cards
│   ├── ui/                      # UI components
│   │   ├── AuthCard.tsx        # Auth page wrapper
│   │   ├── Button.tsx          # Animated button
│   │   ├── Input.tsx           # Form input
│   │   ├── LanguageSelector.tsx # Language switcher
│   │   ├── ThemeToggle.tsx     # Dark/light mode toggle
│   │   └── ParticleBackground.tsx # Particle system
│   └── debug/                   # Debug components
│       └── AuthDebug.tsx       # Auth state debugger
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useLanguage.ts           # i18n hook
│   └── useTheme.ts              # Theme management hook
│
├── lib/                          # Utilities
│   ├── api.ts                   # API client
│   └── i18n.ts                  # Translation definitions
│
├── tailwind.config.js           # Tailwind configuration
├── next.config.js               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

---

## 🎨 Screenshots

### **Landing Page**
Beautiful gradient text with floating animations and particle background.

### **Login Page**
Glassmorphism card with language selector and theme toggle.

### **Admin Dashboard**
Comprehensive system metrics with animated counters and real-time updates.

### **Operator Dashboard**
Live call queue with priority indicators and performance tracking.

### **Shop Owner Dashboard**
Order management with revenue analytics and status tracking.

---

## 🔑 Authentication

### **Test Accounts**
Use your backend credentials to test different roles:

- **Admin**: Full system access
- **Operator**: Call queue and order processing
- **Shop Owner**: Store management and analytics

### **Login Flow**
1. Enter credentials on `/panel/login`
2. Backend validates and returns JWT token
3. User data stored in Zustand with persistence
4. Automatic redirect based on user role
5. Protected routes enforce role-based access

---

## 🌐 API Documentation

### **Backend Integration**
The frontend connects to your backend API running on port 3000.

### **API Proxy**
Next.js proxies all `/api/*` requests to `http://localhost:3000/api/*` to avoid CORS issues.

### **Endpoints Used**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### **Authentication Header**
```javascript
Authorization: Bearer <jwt_token>
```

---

## 🎯 Key Features Implementation

### **Glassmorphism Effects**
```css
.glass-card {
  backdrop-blur: 40px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### **Animated Counters**
```tsx
<CountUp end={1250} duration={2} className="text-4xl font-bold" />
```

### **Particle System**
Canvas-based particle system with connecting lines and smooth animations.

### **Role-Based Routing**
```tsx
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

---

## 🌍 Internationalization (i18n)

### **Supported Languages**
- 🇺🇸 English (en)
- 🇫🇷 French (fr)
- 🇸🇦 Arabic (ar)

### **Usage**
```tsx
const { t } = useLanguage()
<h1>{t('dashboard.admin')}</h1>
```

### **Adding Translations**
Edit `lib/i18n.ts` to add new translation keys:
```typescript
export const translations = {
  en: { 'key': 'English text' },
  fr: { 'key': 'Texte français' },
  ar: { 'key': 'النص العربي' }
}
```

---

## 🎨 Theming

### **Dark Mode (Default)**
- Slate-950 background with gradient overlays
- White text with proper contrast
- Neon blue accents

### **Light Mode**
- Gray-50 background with subtle gradients
- Dark text for readability
- Adjusted component colors

### **Toggle Theme**
```tsx
const { theme, toggleTheme } = useTheme()
<button onClick={toggleTheme}>Toggle Theme</button>
```

---

## 🚀 Performance Optimizations

### **Bundle Size**
- Code splitting by route
- Lazy loading for heavy components
- Tree shaking for unused code

### **Animations**
- 60fps smooth animations
- GPU-accelerated transforms
- Optimized re-renders with React.memo

### **Images**
- Next.js Image component
- Automatic optimization
- Lazy loading

### **Caching**
- React Query for server state
- Zustand persist for client state
- localStorage for preferences

---

## 🔧 Configuration

### **Environment Variables**
```env
# Not required - API proxy configured in next.config.js
```

### **Tailwind Configuration**
Custom colors, animations, and utilities in `tailwind.config.js`

### **Next.js Configuration**
API proxy and image domains in `next.config.js`

---

## 📦 Dependencies

### **Core**
- next: ^14.0.4
- react: ^18.2.0
- typescript: ^5.3.3

### **Styling**
- tailwindcss: ^3.4.0
- framer-motion: ^10.16.16

### **State Management**
- zustand: ^4.4.7
- @tanstack/react-query: ^5.14.2

### **UI Components**
- @headlessui/react: ^1.7.17
- @heroicons/react: ^2.0.18
- lucide-react: ^0.300.0

### **Utilities**
- axios: ^1.6.2
- clsx: ^2.0.0
- react-countup: ^6.5.0

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Vercel** - Deployment platform

---

## 📞 Support

For support, email your.email@example.com or open an issue on GitHub.

---

<div align="center">

**Made with ❤️ and ☕**

⭐ Star this repo if you find it helpful!

</div>
