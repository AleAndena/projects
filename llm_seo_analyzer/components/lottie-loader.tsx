"use client";
import Lottie from "lottie-react";
import loaderAnim from "@/public/loading-animation.json";

export default function LottieLoader({
  size = 96,
  loop = true,
}) {
  return (
    <Lottie
      animationData={loaderAnim}
      loop={loop}
      autoplay
      style={{ width: size, height: size }}
      aria-label="Loading…"
    />
  );
}
