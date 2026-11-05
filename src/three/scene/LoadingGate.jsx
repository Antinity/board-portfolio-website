"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { loading } from "../loading";

/**
 * Once every sheet is painted, compile all shaders up front (so the first
 * frames after the loader don't hitch), then tell the loader we're ready.
 */
export default function LoadingGate({ steps }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    loading.expect(steps);
    let finished = false;
    const unsubscribe = loading.subscribe(({ done, total }) => {
      if (finished || done < total) return;
      finished = true;
      // compileAsync lets the driver build shaders in parallel without freezing the page
      // (KHR_parallel_shader_compile); older three falls back to a blocking compile
      requestAnimationFrame(async () => {
        try {
          if (gl.compileAsync) await gl.compileAsync(scene, camera);
          else gl.compile(scene, camera);
        } catch {
          /* a failed warm-up only means a hitch later, never a stuck loader */
        }
        requestAnimationFrame(() => loading.finish());
      });
    });
    return unsubscribe;
  }, [gl, scene, camera, steps]);

  return null;
}
