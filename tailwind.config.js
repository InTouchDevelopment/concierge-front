/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2433A7',
          50: '#EBEDF9',
          100: '#D7DBF3',
          200: '#AFB7E7',
          300: '#8793DB',
          400: '#5F6FCF',
          500: '#2433A7',
          600: '#1D2986',
          700: '#161F64',
          800: '#0E1443',
          900: '#070A21',
        },
        secondary: {
          DEFAULT: '#527AD3',
          50: '#EEF2FB',
          100: '#DCE5F7',
          200: '#B9CBEF',
          300: '#96B1E7',
          400: '#7397DF',
          500: '#527AD3',
          600: '#3A5FB3',
          700: '#2D4A8C',
          800: '#203565',
          900: '#131F3D',
        },
        accent: {
          DEFAULT: '#9BB3E5',
          light: '#C5D4F1',
          dark: '#7191D9',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(36, 51, 167, 0.1), 0 10px 20px -2px rgba(36, 51, 167, 0.04)',
        'glow': '0 0 20px rgba(36, 51, 167, 0.15)',
      },
    },
  },
  plugins: [],
}
