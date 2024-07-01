import * as THREE from "three";

export default class CharacterController {
  constructor(character, camera, groundMesh, projects) {
    this.character = character;
    this.camera = camera;
    this.groundMesh = groundMesh;
    this.projects = projects;
    this.isPause = true;

    this.maxMoveDistance = 20; // Define maximum move distance

    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener("mousedown", this.onMouseDown.bind(this), false);
    document.addEventListener("dblclick", this.onDoubleClick.bind(this), false);
  }

  isClickOutsideMenu(event) {
    const menuOverlay = document.getElementById("navigation");
    return !menuOverlay.contains(event.target);
  }

  constrainPosition(currentPosition, targetPosition) {
    const distance = currentPosition.distanceTo(targetPosition);

    if (distance > this.maxMoveDistance) {
      const direction = targetPosition.clone().sub(currentPosition).normalize();
      return currentPosition
        .clone()
        .add(direction.multiplyScalar(this.maxMoveDistance));
    }

    return targetPosition;
  }

  onMouseDown(event) {
    if (this.isPause) return;
    if (!this.isClickOutsideMenu(event)) return;
    event.preventDefault();

    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera.camera);
    const intersects = raycaster.intersectObject(this.groundMesh);

    if (intersects.length > 0) {
      const targetPosition = intersects[0].point;
      const constrainedPosition = this.constrainPosition(
        this.character.mesh.position,
        targetPosition
      );

      this.character.moveTo(constrainedPosition);
      this.camera.updateCameraPosition(constrainedPosition);
    }
  }

  pause() {
    this.isPause = true;
  }

  unpause() {
    this.isPause = false;
  }

  onDoubleClick(event) {
    if (this.isPause) return;
    event.preventDefault();
    this.character.jump();
  }

  update(delta) {
    this.character.update(delta);
    this.camera.animate();
    this.projects.checkCharacterProximity(this.character, this.camera);
  }
}
