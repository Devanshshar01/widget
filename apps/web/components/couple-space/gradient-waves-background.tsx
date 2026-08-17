"use client";

import GradientWaves from "@/components/GradientWaves";

export function GradientWavesBackground() {
  return (
    <div
      className="auth-background"
      aria-hidden="true"
    >
      <GradientWaves
        horizonColor="#757bd7"
        waveColor="#0a0f15"
        crestColor="#bab6ba"
        speed={0.4}
        amplitude={2.5}
        waveScale={0.6}
        waveRatio={0.9}
        swell={35}
        turbulence={20}
        tilt={1.11}
        zoom={1}
        height={5.5}
        fogDepth={15}
        detail="medium"
        brightness={0.8}
        opacity={0.78}
        mouseInteraction={true}
        parallaxStrength={0.5}
        grain={true}
        grainIntensity={0.05}
      />
    </div>
  );
}