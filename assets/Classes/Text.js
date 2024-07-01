import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const FONT_URL = "assets/fonts/PatrickHand_Regular.json";
const DEFAULT_COLOR = 0x696969;

export default class Text {
  constructor(
    scene,
    text,
    position,
    size = 1,
    height = 0.1,
    centerHorizontally = false
  ) {
    this.scene = scene;
    this.text = text;
    this.position = position;
    this.size = size;
    this.height = height;
    this.color = DEFAULT_COLOR;
    this.fontUrl = FONT_URL;
    this.centerHorizontally = centerHorizontally;
    this.init();
  }

  init() {
    const loader = new FontLoader();
    loader.load(this.fontUrl, (font) => {
      const lines = this.text.split("\n");
      const lineHeight = this.size * 1.5;

      lines.forEach((line, index) => {
        const textGeometry = new TextGeometry(line, {
          font: font,
          size: this.size,
          height: this.height,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 1,
        });

        textGeometry.computeBoundingBox();
        const boundingBox = textGeometry.boundingBox;

        const textMaterial = new THREE.MeshStandardMaterial({
          color: this.color,
          depthWrite: true,
          depthTest: true,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.receiveShadow = true;
        textMesh.rotation.x = -Math.PI / 2;

        const yOffset = index * lineHeight;

        if (this.centerHorizontally) {
          const textWidth = boundingBox.max.x - boundingBox.min.x;
          textMesh.position.set(
            this.position.x - textWidth / 2,
            this.position.y,
            this.position.z + yOffset
          );
        } else {
          textMesh.position.set(
            this.position.x,
            this.position.y,
            this.position.z + yOffset
          );
        }

        this.scene.add(textMesh);
      });
    });
  }
}
