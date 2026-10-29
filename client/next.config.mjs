// host of the backend that serves profile pictures (/api/v1/user/:id/photo)
let apiHost = "snippet-master.onrender.com";
try {
  const raw = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL;
  if (raw) apiHost = new URL(raw).hostname;
} catch (e) {
  // keep the default
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
    remotePatterns: [
      { protocol: "https", hostname: apiHost },
      { protocol: "https", hostname: "**.onrender.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
