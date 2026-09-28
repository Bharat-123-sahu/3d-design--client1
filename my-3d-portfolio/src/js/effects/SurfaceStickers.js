import * as THREE from "three";
import vertexShader from "../shaders/liquid/stickerVertex.glsl";
import fragmentShader from "../shaders/liquid/stickerFragment.glsl";
import { stickerLibrary } from "../data/stickerData.js";

/** One atlas, one growing instanced draw, and one preview. No per-mark meshes. */
export class SurfaceStickers {
  constructor(parent, uniforms) {
    this.parent = parent;
    this.ids = Object.keys(stickerLibrary);
    this.capacity = 64;
    this.count = 0;
    this.clock = { value: 0 };
    this.canvas = document.createElement("canvas");
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    this.atlas = new THREE.CanvasTexture(this.canvas);
    this.atlas.colorSpace = THREE.SRGBColorSpace;
    this.atlas.anisotropy = 4;
    this.loaded = new Set();
    this.loading = new Map();
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...uniforms,
        uAtlas: { value: this.atlas },
        uClock: this.clock,
        uPreview: { value: 0 },
      },
      // Alpha cutouts write depth: stickers on the far side cannot show through.
      depthWrite: true,
    });
    this.mesh = new THREE.Mesh(this.geometry(this.capacity), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
    this.previewMaterial = this.material.clone();
    this.previewMaterial.uniforms = {
      ...this.material.uniforms,
      uPreview: { value: 1 },
    };
    this.preview = new THREE.Mesh(this.geometry(1), this.previewMaterial);
    this.preview.frustumCulled = false;
    this.preview.renderOrder = 3;
    this.preview.visible = false;
    parent.add(this.mesh, this.preview);
    this.previewCenter = new THREE.Vector3(0, 0, 1);
    this.previewTarget = new THREE.Vector3(0, 0, 1);
    this.previewTangent = new THREE.Vector3(1, 0, 0);
    // Start once; failures remain retryable on the next interaction.
    this.ids.forEach((id) => this.load(id).catch(() => {}));
  }

  geometry(capacity) {
    const patch = new THREE.PlaneGeometry(1, 1, 12, 12);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = patch.index;
    geometry.attributes.position = patch.attributes.position;
    geometry.attributes.uv = patch.attributes.uv;
    for (const [name, size] of [
      ["aCenter", 3],
      ["aTangent", 3],
      ["aMark", 4],
    ]) {
      geometry.setAttribute(
        name,
        new THREE.InstancedBufferAttribute(
          new Float32Array(capacity * size),
          size,
        ).setUsage(THREE.DynamicDrawUsage),
      );
    }
    geometry.instanceCount = 0;
    return geometry;
  }

  load(id) {
    if (this.loaded.has(id)) return Promise.resolve();
    if (this.loading.has(id)) return this.loading.get(id);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(stickerLibrary[id].src);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const svgText = await response.text();

        const blob = new Blob([svgText], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);

        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
          if (!this.destroyed) {
            const tile = this.ids.indexOf(id);
            const context = this.canvas.getContext("2d");
            // 8x8 grid -> 256 size.
            context.drawImage(
              image,
              (tile % 8) * 256 + 12,
              Math.floor(tile / 8) * 256 + 12,
              232,
              232,
            );
            this.atlas.needsUpdate = true;
            this.loaded.add(id);
          }
          URL.revokeObjectURL(url);
          resolve();
        };
        image.onerror = (e) => {
          URL.revokeObjectURL(url);
          this.loading.delete(id);
          reject(new Error("Sticker artwork could not load"));
        };
        image.src = url;
      } catch (err) {
        this.loading.delete(id);
        reject(err);
      }
    });
    this.loading.set(id, promise);
    return promise;
  }

  write(geometry, index, id, center, tangent, birth, size, layer = 0) {
    const attributes = geometry.attributes;
    attributes.aCenter.setXYZ(index, center.x, center.y, center.z);
    attributes.aTangent.setXYZ(index, tangent.x, tangent.y, tangent.z);
    attributes.aMark.setXYZW(index, this.ids.indexOf(id), birth, size, layer);
    for (const name of ["aCenter", "aTangent", "aMark"]) {
      attributes[name].addUpdateRange(
        index * attributes[name].itemSize,
        attributes[name].itemSize,
      );
      attributes[name].needsUpdate = true;
    }
  }

  add(id, center, tangent, reduced) {
    if (this.count === this.capacity) {
      this.capacity *= 2;
      const previous = this.mesh.geometry;
      const next = this.geometry(this.capacity);
      for (const name of ["aCenter", "aTangent", "aMark"])
        next.attributes[name].array.set(previous.attributes[name].array);
      this.mesh.geometry = next;
      previous.dispose();
    }
    const index = this.count++;
    // Bounded layering preserves new ink above old ink, without floating stacks.
    const layer = (0.005 * index) / (index + 50);
    this.write(
      this.mesh.geometry,
      index,
      id,
      center,
      tangent,
      this.clock.value - (reduced ? 1 : 0),
      0.43,
      layer,
    );
    this.mesh.geometry.instanceCount = this.count;
    return index;
  }

  showPreview(id, center, tangent) {
    if (!center) {
      this.preview.visible = false;
      return;
    }
    if (!this.preview.visible) this.previewCenter.copy(center);
    this.previewTarget.copy(center);
    this.previewTangent.copy(tangent);
    this.previewId = id;
    this.preview.visible = this.loaded.has(id);
    this.preview.geometry.instanceCount = 1;
  }

  update(delta) {
    this.clock.value += delta;
    if (!this.preview.visible) return;
    this.previewCenter
      .lerp(this.previewTarget, 1 - Math.exp(-delta * 22))
      .normalize();
    this.write(
      this.preview.geometry,
      0,
      this.previewId,
      this.previewCenter,
      this.previewTangent,
      0,
      0.34,
    );
  }

  destroy() {
    this.destroyed = true;
    this.parent.remove(this.mesh, this.preview);
    this.mesh.geometry.dispose();
    this.preview.geometry.dispose();
    this.material.dispose();
    this.previewMaterial.dispose();
    this.atlas.dispose();
  }
}
