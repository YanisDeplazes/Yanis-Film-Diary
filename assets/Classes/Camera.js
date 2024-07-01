import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import Projects from "./Projects.js";

export default class Camera {
  static lastElementPosition = 0;

  constructor(renderer) {
    this.height = Projects.lastElementPosition;
    this.positionVector = new THREE.Vector3(0, 12, 12);
    this.initialZ = this.positionVector.z; // Store the initial Z position
    this.targetPosition = this.positionVector.clone();
    this.isTopView = false;
    this.targetQuaternion = new THREE.Quaternion();
    this.maxOffset = 10;
    this.progressBar = document.getElementById("progress-bar");

    this.initCamera(renderer);
  }

  initCamera(renderer) {
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.positionVector);
    this.controls = new OrbitControls(this.camera, renderer.domElement);
    this.disableControls();
    this.updateCameraRotation();
    this.controls.update();
  }

  disableControls() {
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
  }

  updateAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  updateCameraPosition(characterPosition) {
    this.targetPosition.setY(characterPosition.y + this.positionVector.y);

    let newZ = characterPosition.z + this.positionVector.z;

    this.targetPosition.setZ(
      Math.min(Camera.lastElementPosition + 10, Math.max(this.initialZ, newZ))
    );

    this.updateProgressBar(characterPosition.z);
  }

  updateCameraRotation() {
    const targetRotation = new THREE.Euler();
    if (this.isTopView) {
      targetRotation.set(-Math.PI / 2, 0, 0);
    } else {
      const angleX = Math.atan2(this.positionVector.y, this.positionVector.z);
      targetRotation.set(-angleX, 0, 0);
    }
    this.targetQuaternion.setFromEuler(targetRotation);
  }

  animate() {
    this.camera.position.lerp(this.targetPosition, 0.02);
    this.camera.quaternion.slerp(this.targetQuaternion, 0.08);
  }

  setGroundMesh(groundMesh) {
    this.groundMesh = groundMesh;
  }

  setCharacter(character) {
    this.character = character;
  }

  setTopView(isTopView) {
    this.isTopView = isTopView;
    const characterPosition = this.character.targetPosition;

    if (isTopView) {
      this.positionVector.set(0, 20, 0);
    } else {
      this.positionVector.set(0, 12, 12);
    }

    this.updateCameraRotation();
    this.updateCameraPosition(characterPosition);
  }

  updateProgressBar(currentZ) {
    const totalDistance = Camera.lastElementPosition - this.initialZ;
    const traveledDistance = currentZ - this.initialZ;
    const progressPercentage = (traveledDistance / totalDistance) * 100;

    this.progressBar.style.width = `${progressPercentage}%`;

    this.updateHTMLTitle(progressPercentage);
  }

  updateHTMLTitle(progressPercentage) {
    const filmReelCount = Math.floor(progressPercentage / 10);
    const filmReelEmoji = "🎞️";
    if (filmReelCount >= 0) {
      const title = filmReelEmoji.repeat(filmReelCount);
      document.title = title || "🎞️";
    } else {
      document.title = "Yanis' Film Diary";
    }
  }
}
