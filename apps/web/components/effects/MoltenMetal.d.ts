declare module "@/components/effects/MoltenMetal" {
  import type { ComponentType } from "react";

  interface MoltenMetalProps {
    color1?: string;
    color2?: string;
    color3?: string;
    speed?: number;
    scale?: number;
    detail?: number;
    glow?: number;
    coreSize?: number;
    swirl?: number;
    fold?: number;
    blackPoint?: number;
    brightness?: number;
    colorMode?: "molten" | "ember" | "frost";
    grain?: boolean;
    grainIntensity?: number;
    mouseInteraction?: boolean;
    mouseStrength?: number;
    opacity?: number;
    className?: string;
  }

  const MoltenMetal: ComponentType<MoltenMetalProps>;

  export default MoltenMetal;
}