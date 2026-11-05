import * as THREE from "three";

/*
 * Lite shading, for GPUs that can't keep up even with post-processing off.
 *
 * The full scene lights every pixel with physically based shading from four
 * lights, three of them sampling shadow maps with soft filtering. Lite keeps
 * the same lights and the same look of the torch (its beam pattern, its
 * colour and flicker), but works them out in a handful of lines per pixel:
 * plain diffuse light, no specular, no shadow maps (the baked contact
 * shadows under the paper stay). That is several times cheaper, so the board
 * can still be drawn at (close to) the screen's own resolution and stay
 * readable, instead of being smeared by rendering at a fraction of it.
 *
 * The lights publish their current values into `liteUniforms` every frame
 * (Flashlight) or once (Lamp, Moonlight); `makeLite` patches a material.
 */
export const liteUniforms = {
  uLiteSky: { value: new THREE.Color() },
  uLiteGround: { value: new THREE.Color() },
  uLiteMoonDir: { value: new THREE.Vector3(0, 0, 1) },
  uLiteMoonColor: { value: new THREE.Color() },
  uLiteLampPos: { value: new THREE.Vector3() },
  uLiteLampDir: { value: new THREE.Vector3(0, -1, 0) },
  uLiteLampCos: { value: Math.cos(1.15) },
  uLiteLampColor: { value: new THREE.Color() },
  uLiteTorchPos: { value: new THREE.Vector3(0, 0, 30) },
  uLiteTorchAim: { value: new THREE.Vector3() },
  uLiteTorchRadius: { value: 12.2 },
  uLiteTorchColor: { value: new THREE.Color() },
  uLiteTorchCookie: { value: null },
};

const VERTEX_HEAD = /* glsl */ `
varying vec3 vLiteWorld;
varying vec3 vLiteNormal;
`;

const VERTEX_BODY = /* glsl */ `
vLiteWorld = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;
vLiteNormal = normalize( mat3( modelMatrix ) * objectNormal );
`;

const FRAGMENT_HEAD = /* glsl */ `
varying vec3 vLiteWorld;
varying vec3 vLiteNormal;
uniform vec3 uLiteSky;
uniform vec3 uLiteGround;
uniform vec3 uLiteMoonDir;
uniform vec3 uLiteMoonColor;
uniform vec3 uLiteLampPos;
uniform vec3 uLiteLampDir;
uniform float uLiteLampCos;
uniform vec3 uLiteLampColor;
uniform vec3 uLiteTorchPos;
uniform vec3 uLiteTorchAim;
uniform float uLiteTorchRadius;
uniform vec3 uLiteTorchColor;
uniform sampler2D uLiteTorchCookie;
`;

// the same light the full shader gathers (hemisphere, moon, lamp, torch), diffuse only
const FRAGMENT_LIGHT = /* glsl */ `
vec3 liteN = normalize( vLiteNormal ) * ( gl_FrontFacing ? 1.0 : -1.0 );
vec3 liteLight = mix( uLiteGround, uLiteSky, 0.5 * liteN.y + 0.5 );
liteLight += uLiteMoonColor * max( dot( liteN, uLiteMoonDir ), 0.0 );
vec3 liteToLamp = normalize( uLiteLampPos - vLiteWorld );
liteLight += uLiteLampColor * max( dot( liteN, liteToLamp ), 0.0 ) * smoothstep( uLiteLampCos, 1.0, dot( -liteToLamp, uLiteLampDir ) );
vec2 liteBeam = ( vLiteWorld.xy - uLiteTorchAim.xy ) / ( 2.0 * uLiteTorchRadius ) + 0.5;
if ( all( greaterThan( liteBeam, vec2( 0.0 ) ) ) && all( lessThan( liteBeam, vec2( 1.0 ) ) ) ) {
  liteLight += uLiteTorchColor * texture2D( uLiteTorchCookie, liteBeam ).rgb * max( dot( liteN, normalize( uLiteTorchPos - vLiteWorld ) ), 0.0 );
}
vec3 outgoingLight = material.diffuseColor * liteLight * RECIPROCAL_PI + totalEmissiveRadiance;
`;

// the glow map is only read while something glows (a page held up to read)
const LITE_EMISSIVE = /* glsl */ `
#ifdef USE_EMISSIVEMAP
  if ( any( greaterThan( totalEmissiveRadiance, vec3( 0.0 ) ) ) ) totalEmissiveRadiance *= texture2D( emissiveMap, vEmissiveMapUv, -0.8 ).rgb;
#endif
`;

// fully clear pixels (most of a marker layer written on the board) are dropped before any lighting or blending
const LITE_CLEAR = /* glsl */ `
#include <alphatest_fragment>
if ( diffuseColor.a < 0.004 ) discard;
`;

function liteShader(shader) {
  Object.assign(shader.uniforms, liteUniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
    .replace("#include <project_vertex>", `#include <project_vertex>\n${VERTEX_BODY}`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
    .replace("#include <alphatest_fragment>", LITE_CLEAR)
    .replace("#include <normal_fragment_maps>", "") // no bump mapping: three texture reads a pixel saved
    .replace("#include <emissivemap_fragment>", LITE_EMISSIVE)
    .replace("#include <lights_fragment_begin>", "")
    .replace("#include <lights_fragment_maps>", "")
    .replace("#include <lights_fragment_end>", "")
    .replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", FRAGMENT_LIGHT);
}

/** Switch a MeshStandardMaterial to lite shading (keeping any shader patch it already has). */
export function makeLite(material) {
  if (!material?.isMeshStandardMaterial || material.userData.lite) return;
  const before = material.onBeforeCompile;
  const beforeKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    liteShader(shader); // first, so it owns the chunks it rewrites
    before.call(material, shader, renderer);
  };
  material.customProgramCacheKey = () => `${beforeKey.call(material)}|lite`;
  material.userData.lite = true;
  material.needsUpdate = true;
}
