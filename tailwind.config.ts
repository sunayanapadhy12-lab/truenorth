import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cranberry: {
          50: '#fdf2f4',
          100: '#fbe6e9',
          200: '#f7cfd6',
          300: '#f0aab7',
          400: '#e5798e',
          500: '#d44967',
          600: '#be2e50',
          700: '#9f213f',
          800: '#851e37',
          900: '#721d33',
          950: '#400a18',
        },
      },
    },
  },
  plugins: [],
};

export default config;

