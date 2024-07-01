import * as THREE from "three";

export default class ProgressLine {
  constructor(scene, start, end) {
    this.scene = scene;
    this.start = start;
    this.end = end;
    this.line = null;
    this.maxProgress = 0;
    this.createLine();
  }

  createLine() {
    const material = new THREE.MeshBasicMaterial({ color: 0x93a9e2 });
    const geometry = new THREE.PlaneGeometry(0.2, 0);
    this.line = new THREE.Mesh(geometry, material);
    this.line.position.set(this.start.x, this.start.y, this.start.z);
    this.line.rotation.x = -Math.PI / 2;
    this.scene.add(this.line);
  }

  updateLine(zPos) {
    if (zPos < this.start.z) return;

    const progress = Math.min(
      Math.max((zPos - this.start.z) / (this.end.z - this.start.z), 0),
      1
    );
    if (progress > this.maxProgress) {
      this.maxProgress = progress;
      const newHeight = (this.end.z - this.start.z) * progress;
      this.line.geometry.dispose();
      this.line.geometry = new THREE.PlaneGeometry(0.2, newHeight);
      this.line.position.set(
        this.start.x,
        this.start.y,
        this.start.z + newHeight / 2
      );
    }

    if (progress === 1) {
      if (this.onFullyCompleteCallback) {
        this.onFullyCompleteCallback();
      }
    }
  }

  onFullyComplete(callback) {
    this.onFullyCompleteCallback = callback;
  }

  getProgress() {
    return this.maxProgress;
  }
}
