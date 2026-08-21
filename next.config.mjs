/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://tfjjajpghgvjrxbbzytz.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmamphanBnaGd2anJ4YmJ6eXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjE1NjAsImV4cCI6MjEwMTQzNzU2MH0.g0B9GyEMi143cPrVjDpBht3Y1ISY7uXY5wO_HFKZ58o",
    NEXT_PUBLIC_APP_NAME: "Minha Ficha Fitness",
    NEXT_PUBLIC_APP_URL: "https://fitness-rust-ten.vercel.app",
  },
};

export default nextConfig;
