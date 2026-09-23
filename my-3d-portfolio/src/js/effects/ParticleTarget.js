export class ParticleTarget {
  static async fromImage(
    imageUrl,
    options = {}
  ) {
    const {
      width = 160,
      height = 160,
      threshold = 20,
      scale = 0.025,
      depth = 0,
    } = options;

    const image =
      await this.loadImage(imageUrl);

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    context.clearRect(
      0,
      0,
      width,
      height
    );

    /*
     * Keep image proportions
     */
    const imageRatio =
      image.width / image.height;

    const canvasRatio =
      width / height;

    let drawWidth = width;
    let drawHeight = height;

    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      drawHeight =
        width / imageRatio;

      offsetY =
        (height - drawHeight) / 2;
    } else {
      drawWidth =
        height * imageRatio;

      offsetX =
        (width - drawWidth) / 2;
    }

    context.drawImage(
      image,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );

    const pixels =
      context.getImageData(
        0,
        0,
        width,
        height
      ).data;

    const positions = [];

    /*
     * Read pixels
     */
    for (
      let y = 0;
      y < height;
      y++
    ) {
      for (
        let x = 0;
        x < width;
        x++
      ) {
        const index =
          (y * width + x) * 4;

        const r =
          pixels[index];

        const g =
          pixels[index + 1];

        const b =
          pixels[index + 2];

        const alpha =
          pixels[index + 3];

        const brightness =
          (r + g + b) / 3;

        /*
         * Ignore transparent/
         * almost invisible pixels
         */
        if (
          alpha < threshold ||
          brightness < 8
        ) {
          continue;
        }

        const px =
          (x - width / 2) *
          scale;

        const py =
          -(y - height / 2) *
          scale;

        const pz =
          (Math.random() - 0.5) *
          depth;

        positions.push(
          px,
          py,
          pz
        );
      }
    }

    return new Float32Array(
      positions
    );
  }

  static loadImage(url) {
    return new Promise(
      (resolve, reject) => {
        const image =
          new Image();

        image.onload = () =>
          resolve(image);

        image.onerror = () =>
          reject(
            new Error(
              `Failed to load image: ${url}`
            )
          );

        image.src = url;
      }
    );
  }
}