/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactCompiler: true,
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
