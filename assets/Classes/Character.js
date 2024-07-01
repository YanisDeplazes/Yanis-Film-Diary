import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

export default class Character {
  constructor(scene, loadingManager) {
    this.scene = scene;
    this.modelPath = "assets/character/character.fbx";
    this.animationPaths = {
      running: "assets/character/running.fbx",
      jump: "assets/character/jump.fbx",
    };
    this.soundPaths = {
      running: "assets/sounds/running.mp3",
      jump: "assets/sounds/jump.mp3",
    };
    this.mesh = null;
    this.mixer = null;
    this.animations = {};
    this.currentAction = null;
    this.targetPosition = null;
    this.velocity = 5;
    this.jumpVelocity = 0;
    this.isJumping = false;
    this.jumpStart = new THREE.Vector3();
    this.jumpEnd = new THREE.Vector3();
    this.jumpHeight = 3;
    this.jumpTime = 0;
    this.totalJumpTime = 1;
    this.landingDelay = 0;
    this.targetRotation = new THREE.Euler();
    this.isRotating = false;

    this.lastRunningSoundTime = 0;
    this.runningSoundInterval = 400;

    this.loadModel(loadingManager);
    this.loadSounds(loadingManager);
  }

  loadModel(loadingManager) {
    const loader = new FBXLoader(loadingManager);
    loader.load(this.modelPath, (fbx) => {
      this.mesh = fbx;
      this.mesh.scale.multiplyScalar(0.03);

      this.mesh.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material.shininess = 1;
          node.material.metalness = 0;
          node.material.roughness = 0.7;

          if (node.material.map) {
            node.material.map.anisotropy = 32;
            node.material.map.colorSpace = THREE.SRGBColorSpace;
          }

          if (node.material.normalMap) {
            node.material.normalMap.anisotropy = 32;
            node.material.normalMap.colorSpace = THREE.SRGBColorSpace;
          }

          if (node.material.roughnessMap) {
            node.material.roughnessMap.anisotropy = 32;
            node.material.roughnessMap.colorSpace = THREE.SRGBColorSpace;
          }

          node.material.needsUpdate = true;
        }
      });

      this.scene.add(this.mesh);

      this.mixer = new THREE.AnimationMixer(this.mesh);

      const idleClip = fbx.animations[0];
      this.animations["idle"] = this.mixer.clipAction(idleClip);
      this.playAnimation("idle");

      this.loadRunningAnimation(loadingManager);
      this.loadJumpAnimation(loadingManager);
    });
  }

  loadRunningAnimation(loadingManager) {
    const loader = new FBXLoader(loadingManager);
    loader.load(this.animationPaths.running, (fbx) => {
      const clip = fbx.animations[0];
      this.animations["running"] = this.mixer.clipAction(clip);
    });
  }

  loadJumpAnimation(loadingManager) {
    const loader = new FBXLoader(loadingManager);
    loader.load(this.animationPaths.jump, (fbx) => {
      const clip = fbx.animations[0];
      this.animations["jump"] = this.mixer.clipAction(clip);
    });
  }

  loadSounds(loadingManager) {
    const listener = new THREE.AudioListener();
    this.scene.add(listener);

    this.runningSound = new THREE.Audio(listener);
    this.jumpSound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader(loadingManager);
    audioLoader.load(this.soundPaths.running, (buffer) => {
      this.runningSound.setBuffer(buffer);
      this.runningSound.setLoop(false);
      this.runningSound.setVolume(0.5);
    });

    audioLoader.load(this.soundPaths.jump, (buffer) => {
      this.jumpSound.setBuffer(buffer);
      this.jumpSound.setVolume(0.2);
    });
  }

  playAnimation(name) {
    if (this.animations[name]) {
      if (this.currentAction && this.currentAction !== this.animations[name]) {
        this.currentAction.fadeOut(0.5);
      }
      this.currentAction = this.animations[name];
      this.currentAction.reset().fadeIn(0.5).play();

      if (name === "running" && !this.isJumping) {
        this.playRunningSound();
      } else {
        this.runningSound.pause();
      }

      if (name === "jump") {
        this.jumpSound.play();
      }
    }
  }

  playRunningSound() {
    const currentTime = Date.now();
    if (currentTime - this.lastRunningSoundTime > this.runningSoundInterval) {
      this.runningSound.play();
      this.lastRunningSoundTime = currentTime;
    }
  }

  moveTo(position) {
    this.targetPosition = position.clone();
    this.rotateToTarget(position);
    if (this.currentAction !== this.animations["running"]) {
      this.playAnimation("running");
    }
  }

  rotateToTarget(target) {
    if (this.mesh) {
      const direction = target.clone().sub(this.mesh.position).normalize();
      const angle = Math.atan2(direction.x, direction.z);
      this.targetRotation.set(0, angle, 0);
      this.isRotating = true;
    }
  }

  jump() {
    if (!this.isJumping && this.targetPosition) {
      this.isJumping = true;
      this.jumpStart.copy(this.mesh.position);
      this.jumpEnd.copy(this.targetPosition);
      this.jumpTime = 0;
      this.totalJumpTime = 1;
      this.playAnimation("jump");
    }
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (this.isRotating && this.mesh) {
      const currentRotation = this.mesh.rotation.y;
      const targetRotation = this.targetRotation.y;
      const rotationStep = THREE.MathUtils.lerp(
        currentRotation,
        targetRotation,
        delta * 5
      );
      this.mesh.rotation.y = rotationStep;

      if (Math.abs(currentRotation - targetRotation) < 0.01) {
        this.mesh.rotation.y = targetRotation;
        this.isRotating = false;
      }
    }

    if (
      this.targetPosition &&
      this.mesh &&
      !this.isJumping &&
      this.landingDelay <= 0
    ) {
      const direction = this.targetPosition
        .clone()
        .sub(this.mesh.position)
        .normalize();
      const deltaDistance = this.velocity * delta;

      if (this.mesh.position.distanceTo(this.targetPosition) > deltaDistance) {
        this.mesh.position.add(direction.multiplyScalar(deltaDistance));
        this.playRunningSound();
      } else {
        this.mesh.position.copy(this.targetPosition);
        this.targetPosition = null;
        this.playAnimation("idle");
      }
    }

    if (this.isJumping) {
      this.jumpTime += delta;
      const jumpProgress = this.jumpTime / this.totalJumpTime;
      this.mesh.position.lerpVectors(
        this.jumpStart,
        this.jumpEnd,
        jumpProgress
      );
      this.mesh.position.y =
        this.jumpStart.y + this.jumpHeight * Math.sin(Math.PI * jumpProgress);

      if (this.jumpTime >= this.totalJumpTime) {
        this.mesh.position.copy(this.jumpEnd);
        this.isJumping = false;
        this.landingDelay = 0.3;
        this.playAnimation("idle");
      }
    }

    if (this.landingDelay > 0) {
      this.landingDelay -= delta;
      if (this.landingDelay <= 0 && this.targetPosition) {
        this.playAnimation("running");
      }
    }
  }
}
