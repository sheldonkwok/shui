"use client";

import { cva } from "class-variance-authority";
import { useEffect, useRef } from "react";
import { draw } from "./monstera-pixel.ts";

const leaf = cva("w-8 h-8 [image-rendering:pixelated]");

export function MonsteraPixel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) draw(canvasRef.current);
  }, []);

  return (
    <canvas ref={canvasRef} width={64} height={64} aria-hidden="true" tabIndex={-1} className={leaf()} />
  );
}
