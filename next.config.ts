// next.config.ts
import path from "path";
import type { NextConfig } from "next";

/**
 * Sanitized next.config.ts for Thaiba Garden Media Manager
 *
 * - Removes any lingering webpack loader references to 'visual-edits'
 *   so Turbopack/webpack does not attempt to load a missing dev-only loader.
 * - Keeps common safe defaults: reactStrictMode and experimental appDir.
 * - Adds allowedDevOrigins to avoid cross-origin dev warnings on LAN.
 *
 * Paste this file as src root: next.config.ts and restart your dev server:
 * rm -rf .next && npm run dev
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable app directory (you already use it)
  experimental: {
    appDir: true,
  },

  // If you're developing on another device on the LAN, add your host here.
  // Change or remove if not needed.
  allowedDevOrigins: ["http://192.168.0.197:3000"],

  // Minimal webpack sanitizer: remove any loader entries referencing 'visual-edits'
  webpack: (config, { webpack }) => {
    try {
      if (config && config.module && Array.isArray(config.module.rules)) {
        config.module.rules = config.module.rules
          .map((rule: any) => {
            // If rule has a "use" array or single use, normalize and filter
            if (!rule) return rule;

            // Handle rules where `use` is an array
            if (Array.isArray(rule.use)) {
              rule.use = rule.use.filter((u: any) => {
                try {
                  const loaderPath =
                    typeof u === "string"
                      ? u
                      : typeof u?.loader === "string"
                      ? u.loader
                      : "";
                  return !loaderPath.includes("visual-edits");
                } catch {
                  return true;
                }
              });

              // If use became empty, remove it to avoid invalid rule
              if (Array.isArray(rule.use) && rule.use.length === 0) {
                // drop this rule entirely by returning null
                return null;
              }
            } else if (rule.use && typeof rule.use === "object") {
              // Single object `use` form
              const loaderPath =
                typeof rule.use.loader === "string" ? rule.use.loader : "";
              if (loaderPath.includes("visual-edits")) {
                return null;
              }
            }

            // Also sanitize loader property if present directly
            if (typeof rule.loader === "string" && rule.loader.includes("visual-edits")) {
              return null;
            }

            return rule;
          })
          .filter(Boolean);
      }
    } catch (e) {
      // If sanitizer fails, don't block the build — log and continue.
      // (Webpack/Turbopack will still show errors if something else is wrong.)
      // eslint-disable-next-line no-console
      console.warn("next.config.ts: visual-edits sanitizer failed:", e);
    }

    return config;
  },
};

export default nextConfig;
