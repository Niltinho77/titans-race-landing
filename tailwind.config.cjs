/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        titans: {
          primary: "#361259",
          primaryLight: "#6C2BD9",
          bg: "#10041F",
          text: "#E5D7FF",
          accent: "#F5E04E",
        },
      },
      backgroundImage: {
        "titans-gradient":
          "radial-gradient(circle at top, #6C2BD9 0, #10041F 45%, #000000 100%)",
      },
    },
  },
  plugins: [],
};
