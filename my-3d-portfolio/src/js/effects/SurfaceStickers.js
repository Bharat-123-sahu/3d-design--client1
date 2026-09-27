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
    this.grid = Math.max(1, Math.ceil(Math.sqrt(this.ids.length)));
    this.tileSize = Math.min(256, Math.floor(4096 / this.grid));
    this.canvas.width = this.canvas.height = this.grid * this.tileSize;
    this.atlas = new THREE.CanvasTexture(this.canvas);
    this.atlas.colorSpace = THREE.SRGBColorSpace;
    this.atlas.anisotropy = 4;
    this.loaded = new Set();
    this.loading = new Map();
    this.assets = new Map();
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...uniforms,
        uAtlas: { value: this.atlas },
        uAtlasGrid: { value: this.grid },
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
    const promise = this.loadArtwork(id).catch(error => {
      this.loading.delete(id);
      throw error;
    });
    this.loading.set(id, promise);
    return promise;
  }

  report(id, stage, error) {
    if (import.meta.env.DEV) console.error(`[stickers] ${id}.svg | ${stage} | ${error.message}`);
  }

  async loadArtwork(id) {
    let stage = 'fetch';
    let objectURL;
    try {
      const src = stickerLibrary[id].src;
      const response = await fetch(src);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${src}`);
      const text = await response.text();
      stage = 'SVG validation';
      const document = new DOMParser().parseFromString(text, 'image/svg+xml');
      if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') {
        throw new Error(document.querySelector('parsererror')?.textContent || 'No SVG root');
      }
      const decode = url => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Native SVG image decode failed: ${src}`));
        image.src = url;
      });
      stage = 'native image decode';
      let image;
      try { image = await decode(src); }
      catch (error) {
        this.report(id, stage, error);
        stage = 'serialized SVG fallback';
        objectURL = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(document)], { type: 'image/svg+xml' }));
        image = await decode(objectURL);
      }
      if (this.destroyed) { if (objectURL) URL.revokeObjectURL(objectURL); return; }
      stage = 'atlas rasterization';
      const tile = this.ids.indexOf(id), size = this.tileSize;
      const context = this.canvas.getContext('2d');
      const fit = size * (232 / 256) / Math.max(image.naturalWidth, image.naturalHeight);
      const width = image.naturalWidth * fit, height = image.naturalHeight * fit;
      context.drawImage(image, (tile % this.grid) * size + (size - width) / 2,
        Math.floor(tile / this.grid) * size + (size - height) / 2, width, height);
      // Readback also detects security restrictions before publishing a broken texture.
      const pixels = context.getImageData((tile % this.grid) * size, Math.floor(tile / this.grid) * size, size, size).data;
      const visiblePixels = pixels.reduce((sum, value, i) => sum + (i % 4 === 3 && value > 0 ? 1 : 0), 0);
      const color = [0, 0, 0];
      let weight = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]];
        const saturation = (Math.max(...rgb) - Math.min(...rgb)) * pixels[i + 3] / 255;
        weight += saturation;
        rgb.forEach((value, channel) => { color[channel] += value * saturation; });
      }
      this.assets.set(id, {
        image, src: image.src, objectURL, visiblePixels,
        animated: /@keyframes|<animate(?:Transform|Motion)?\b|<set\b|\banimation\s*:/i.test(text),
        complex: /<(?:defs|style|filter|mask|clipPath|linearGradient|radialGradient|use|foreignObject)\b/i.test(text),
        status: 'ready',
        accent: color.map(value => Math.round(value / Math.max(1, weight))).join(','),
      });
      this.atlas.needsUpdate = true;
      this.loaded.add(id);
    } catch (error) {
      if (objectURL) URL.revokeObjectURL(objectURL);
      this.assets.set(id, { status: 'failed', stage, reason: error.message });
      this.report(id, stage, error);
      throw error;
    }
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
      this.clock.value - 1,
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
    for (const asset of this.assets.values()) if (asset.objectURL) URL.revokeObjectURL(asset.objectURL);
    this.assets.clear();
  }
}
