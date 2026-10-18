import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Allow this computer's current LAN addresses when classroom devices use next dev.
// Entries are exact hostnames; no wildcard origins are allowed.
const localAddresses = Object.values(networkInterfaces()).flatMap(addresses =>
  (addresses ?? []).filter(address => !address.internal && address.family === "IPv4")
    .map(address => address.address)
);

const nextConfig: NextConfig = {
  allowedDevOrigins: [...new Set(localAddresses)],
};

export default nextConfig;
