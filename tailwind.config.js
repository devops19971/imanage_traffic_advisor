/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#38bdf8',
          violet: '#8b5cf6',
          magenta: '#ec4899',
          emerald: '#34d399',
        },
        surface: {
          0: '#06090f',
          1: '#0b1120',
          2: '#111827',
          3: '#1a2332',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #38bdf8 0%, #8b5cf6 50%, #ec4899 100%)',
        'subtle-gradient': 'linear-gradient(135deg, rgba(56,189,248,0.1) 0%, rgba(139,92,246,0.05) 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-delay-1': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        'slide-up-delay-2': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
        'slide-up-delay-3': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'gradient-x': 'gradientX 6s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(56, 189, 248, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(56, 189, 248, 0.5), 0 0 50px rgba(139, 92, 246, 0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
