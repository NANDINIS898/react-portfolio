import * as THREE from "three";

/**
 * A fake volumetric light beam: an open cone whose tip sits at the origin and
 * which points down -y, drawn additively and faded toward its base and its
 * silhouette. Aim it by rotating the mesh (or its parent).
 */
export function beamGeometry(radius, length) {
  const g = new THREE.ConeGeometry(radius, length, 48, 1, true);
  g.translate(0, -length / 2, 0); // tip at origin, base at y = -length
  return g;
}

export function beamMaterial(color = "#cdefff", opacity = 0.5) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    vertexShader: /* glsl */ `
      varying float vY;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vY = position.y;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vY;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float edge = abs(dot(vN, vView));
        float a = edge * edge * uOpacity;
        a *= smoothstep(0.0, 0.6, 1.0 + vY * 0.12);   // fade along the length
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

/** Quaternion that turns a beam (pointing -y) to aim from `from` at `to`. */
export function aim(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
}
