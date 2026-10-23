import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "components/**/*.{js,ts,jsx,tsx,mdx}",
    "./providers/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "0": "var(--color--bg-0)",
        "1": "var(--color--bg-1)",
        "2": "var(--color--bg-2)",
        "3": "var(--color--bg-3)",
        "4": "var(--color--bg-4)",
        "5": "var(--color--bg-5)",
        "grey-0": "var(--color--grey-0)",
        "grey-1": "var(--color--grey-1)",
        "grey-2": "var(--color--grey-2)",
        "grey-3": "var(--color--grey-3)",
        "grey-4": "var(--color--grey-4)",
        "grey-5": "var(--color--grey-5)",
        "green-light": "var(--color--green-light)",
        "green-dark": "var(--color--green-dark)",
        "rgba-0": "var(--color--rgba-0)",
        "rgba-1": "var(--color--rgba-1)",
        "rgba-2": "var(--color--rgba-2)",
        "rgba-3": "var(--color--rgba-3)",
        "rgba-4": "var(--color--rgba-4)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
