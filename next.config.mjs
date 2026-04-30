/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make sure the agent manual is bundled with the /api route handler
  // when deployed to Vercel (it's read with fs.readFileSync at runtime).
  outputFileTracingIncludes: {
    "/api": ["./API_AGENTS_DOC.MD"],
  },
};

export default nextConfig;
