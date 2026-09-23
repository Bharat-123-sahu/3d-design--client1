import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class ModelLoader {
  constructor() {
    this.loader = new GLTFLoader();


  }

  load(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          resolve(gltf);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }
}