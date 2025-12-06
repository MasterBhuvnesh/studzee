/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["GoogleSans", "sans-serif"],
        product: ["ProductSans", "sans-serif"],
        "product-bold": ["ProductSans-Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};