declare module "@/components/GradientWaves" {
  import type { ComponentType } from "react";

  type GradientWavesDetail =
    | "low"
    | "medium"
    | "high";

  interface GradientWavesProps {
    horizonColor?: string;
    waveColor?: string;
    crestColor?: string;

    speed?: number;
    amplitude?: number;
    waveScale?: number;
    waveRatio?: number;

    swell?: number;
    turbulence?: number;

    tilt?: number;
    zoom?: number;
    height?: number;
    fogDepth?: number;

    detail?: GradientWavesDetail;

    brightness?: number;
    opacity?: number;

    mouseInteraction?: boolean;
    parallaxStrength?: number;

    grain?: boolean;
    grainIntensity?: number;

    className?: string;
  }

  const GradientWaves: ComponentType<GradientWavesProps>;

  export default GradientWaves;
}