"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { loading } from "../loading";

const WARM_AT = 0.4; // once this share of the sheets is painted, start building shaders alongside the rest

/**
 * Gets the board ready while the loader is up, then tells the loader:
 *  1. builds the shaders early, in parallel with painting
 *     (compileAsync uses KHR_parallel_shader_compile, so the page doesn't freeze)
 *  2. once every sheet is painted, finishes the shaders, then draws the scene
 *     twice off-screen and times the second draw: `onProbe(ms)` lets the
 *     quality ladder start low on a GPU that is plainly too slow, instead
 *     of showing it a slideshow first
 */
export default function LoadingGate({ steps, onProbe }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    loading.expect(steps);
    let warmed = false;
    let finished = false;
    const compile = async () => {
      try {
        if (gl.compileAsync) await gl.compileAsync(scene, camera);
        else gl.compile(scene, camera);
      } catch {
        /* a failed warm-up only means a hitch later, never a stuck loader */
      }
    };
    const unsubscribe = loading.subscribe(({ done, total }) => {
      if (!warmed && done >= total * WARM_AT) {
        warmed = true;
        compile();
      }
      if (finished || done < total) return;
      finished = true;
      requestAnimationFrame(async () => {
        await compile();
        const ms = probe(gl, scene, camera);
        gl.domElement.dataset.probe = ms.toFixed(1); // for checking a device's speed
        onProbe?.(ms);
        requestAnimationFrame(() => loading.finish());
      });
    });
    return unsubscribe;
  }, [gl, scene, camera, steps, onProbe]);

  return null;
}

/** Milliseconds one plain draw of the scene takes (the second of two, read back so it really finished). */
function probe(gl, scene, camera) {
  try {
    const ctx = gl.getContext();
    const pixel = new Uint8Array(4);
    const draw = () => {
      gl.render(scene, camera);
      ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, pixel);
    };
    draw(); // uploads and first-use costs land here
    const t0 = performance.now();
    draw();
    return performance.now() - t0;
  } catch {
    return 0;
  }
}
