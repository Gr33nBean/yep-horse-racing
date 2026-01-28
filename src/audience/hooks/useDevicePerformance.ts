import { useState, useEffect } from "react";

export type PerformanceTier = "high" | "medium" | "low";

interface DevicePerformance {
  tier: PerformanceTier;
  isLowEnd: boolean;
  isMediumEnd: boolean;
  isHighEnd: boolean;
}

/**
 * Detects device performance tier based on:
 * - Hardware concurrency (CPU cores)
 * - Device memory (if available)
 * - Touch support (mobile devices tend to be lower powered)
 * - Screen resolution
 */
export function useDevicePerformance(): DevicePerformance {
  const [tier, setTier] = useState<PerformanceTier>("medium");

  useEffect(() => {
    const detectPerformance = (): PerformanceTier => {
      let score = 0;

      // CPU cores (navigator.hardwareConcurrency)
      const cores = navigator.hardwareConcurrency || 2;
      if (cores >= 8) score += 3;
      else if (cores >= 4) score += 2;
      else score += 0;

      // Device memory (Chrome only)
      const memory = (navigator as any).deviceMemory;
      if (memory) {
        if (memory >= 8) score += 3;
        else if (memory >= 4) score += 2;
        else if (memory >= 2) score += 1;
        else score += 0;
      } else {
        // If not available, assume medium
        score += 1;
      }

      // Screen resolution (high DPI = more powerful device usually)
      const pixelRatio = window.devicePixelRatio || 1;
      const screenArea = window.screen.width * window.screen.height;
      if (screenArea >= 2073600 && pixelRatio >= 2)
        score += 2; // 1920x1080 @ 2x
      else if (screenArea >= 921600)
        score += 1; // 1280x720
      else score += 0;

      // Mobile detection (typically lower performance)
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      if (isMobile) score -= 1;

      // Older iOS devices
      const isOldiOS = /iPhone OS [789]|iPhone OS 1[012]/i.test(
        navigator.userAgent,
      );
      if (isOldiOS) score -= 2;

      // Determine tier
      if (score >= 6) return "high";
      if (score >= 3) return "medium";
      return "low";
    };

    setTier(detectPerformance());
  }, []);

  return {
    tier,
    isLowEnd: tier === "low",
    isMediumEnd: tier === "medium",
    isHighEnd: tier === "high",
  };
}

/**
 * Effect settings based on performance tier
 */
export interface EffectSettings {
  // Animations
  enableAnimations: boolean;
  enableBounce: boolean;
  enableShake: boolean;
  enablePulse: boolean;

  // Visual effects
  enableShadows: boolean;
  enableGradients: boolean;
  enableBlur: boolean;

  // Transitions
  transitionDuration: string;

  // Streak display
  enableStreakDisplay: boolean;
  enableStreakBounce: boolean;
}

export function getEffectSettings(tier: PerformanceTier): EffectSettings {
  switch (tier) {
    case "high":
      return {
        enableAnimations: true,
        enableBounce: true,
        enableShake: true,
        enablePulse: true,
        enableShadows: true,
        enableGradients: true,
        enableBlur: true,
        transitionDuration: "0.3s",
        enableStreakDisplay: true,
        enableStreakBounce: true,
      };
    case "medium":
      return {
        enableAnimations: true,
        enableBounce: true,
        enableShake: false, // Disable shake for smoother experience
        enablePulse: false, // Disable pulse
        enableShadows: true,
        enableGradients: true,
        enableBlur: false, // Blur is expensive
        transitionDuration: "0.2s",
        enableStreakDisplay: true,
        enableStreakBounce: false,
      };
    case "low":
      return {
        enableAnimations: false, // Minimal animations
        enableBounce: false,
        enableShake: false,
        enablePulse: false,
        enableShadows: false, // No shadows
        enableGradients: false, // Use solid colors
        enableBlur: false,
        transitionDuration: "0s", // Instant transitions
        enableStreakDisplay: true, // Keep basic feedback
        enableStreakBounce: false,
      };
  }
}

/**
 * Combined hook for easy usage
 */
export function usePerformanceEffects() {
  const performance = useDevicePerformance();
  const settings = getEffectSettings(performance.tier);

  return {
    ...performance,
    settings,
  };
}
