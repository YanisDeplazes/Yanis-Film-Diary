import * as THREE from "three";

export default class Lighting {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.initLighting();
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    this.scene.add(ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 2);
    this.dirLight.position.set(10, 10, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 4096;
    this.dirLight.shadow.mapSize.height = 4096;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 50;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.0001;

    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.updateLightPosition();
  }

  updateLightPosition() {
    const offset = new THREE.Vector3(10, 10, 10);
    this.dirLight.position.copy(this.camera.position).add(offset);
    this.dirLight.target.position.copy(this.camera.position);
    this.dirLight.target.updateMatrixWorld();
  }

  update() {
    this.updateLightPosition();
  }
}
