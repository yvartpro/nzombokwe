/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/public/**/*.html', './src/public/**/*.js'],
  theme: { extend: { colors: { skybrand: '#37A8EE', ink: '#18334A', muted: '#708397', line: '#E5EDF3', canvas: '#F5F8FA' }, fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] } } },
  plugins: []
};
