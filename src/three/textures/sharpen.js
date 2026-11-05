import * as THREE from "three";

/*
 * Painted pages are drawn into textures at three texture pixels per board
 * pixel. With the board fully zoomed out each one is shrunk four or five
 * times on screen, and the GPU's mip selection then blends in a level that
 * is softer than the screen needs: small writing smears into grey. Sampling
 * a little under one mip level finer keeps it crisp without shimmering.
 */
const BIAS = "-0.8";

const map = THREE.ShaderChunk.map_fragment.replace("texture2D( map, vMapUv )", `texture2D( map, vMapUv, ${BIAS} )`);
const emissive = THREE.ShaderChunk.emissivemap_fragment.replace(
  "texture2D( emissiveMap, vEmissiveMapUv )",
  `texture2D( emissiveMap, vEmissiveMapUv, ${BIAS} )`
);

/** onBeforeCompile for a material whose map and emissive map should stay sharp when shrunk. */
export function sharpMaps(shader) {
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <map_fragment>", map)
    .replace("#include <emissivemap_fragment>", emissive);
}

/** Keeps sharpened materials from sharing a program with ordinary ones. */
export const sharpKey = () => "sharp-maps";

/** Apply to a material made in code. */
export function sharpen(material) {
  material.onBeforeCompile = sharpMaps;
  material.customProgramCacheKey = sharpKey;
  return material;
}
