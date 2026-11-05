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
      requestAnimationFrame(() => {
        gl.compile(scene, camera);
        requestAnimationFrame(() => loading.finish());
      });
    });
    return unsubscribe;
  }, [gl, scene, camera, steps]);

  return null;
}
