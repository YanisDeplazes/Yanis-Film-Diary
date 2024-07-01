import * as THREE from "three";
import Character from "./Character.js";
import Lighting from "./Lighting.js";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import Text from "./Text.js";
import Projects from "./Projects.js";
import CharacterController from "./CharacterController.js";

export default class SceneManager {
  static backgroundMusic = null;
  static songs = [
    "./assets/music/freddie_freeloader.mp3",
    "./assets/music/round_midnight.mp3",
    "./assets/music/so_what.mp3",
  ];

  constructor(loadingManager) {
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.renderer = new Renderer(document.querySelector("#bg")).renderer;
    this.camera = new Camera(this.renderer);
    this.lighting = new Lighting(this.scene, this.camera.camera);
    this.character = new Character(this.scene, loadingManager);
    this.projects = new Projects(this.scene);
    this.isTopDown = false;

    this.init(loadingManager);
  }

  async init(loadingManager) {
    this.initGround(loadingManager);
    this.initGround();
    this.camera.setGroundMesh(this.groundMesh);
    this.camera.setCharacter(this.character);
    this.addText();
    this.characterController = new CharacterController(
      this.character,
      this.camera,
      this.groundMesh,
      this.projects
    );
    this.addResizeListener();
  }

  initGround() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load("assets/bg.webp");
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(70, 70);

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
    });
    const geometry = new THREE.PlaneGeometry(5000, 5000);
    this.groundMesh = new THREE.Mesh(geometry, material);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.1;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  addText() {
    new Text(this.scene, "Hi, I'm Yanis!", { x: 0, y: 0, z: -2 }, 2, 0.2, true);
    new Text(
      this.scene,
      "And welcome to my Film Diary,\nhere I'm showcasing\nmy journey of film photography.",
      { x: -8, y: 0, z: 6 },
      0.5,
      0,
      false
    );
  }

  pause() {
    this.characterController.pause();
  }

  unpause() {
    this.characterController.unpause();
  }

  addResizeListener() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.camera.updateAspect(window.innerWidth / window.innerHeight);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (this.character && this.camera && this.projects) {
      this.characterController.update(delta);
    }

    this.lighting.update();
    this.camera.animate();

    this.renderer.render(this.scene, this.camera.camera);
  }

  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static playNext(index, shuffledSongs) {
    if (index >= shuffledSongs.length) return;

    SceneManager.backgroundMusic = new Audio(shuffledSongs[index]);
    SceneManager.backgroundMusic.play();
    SceneManager.backgroundMusic.volume = 0.2;

    SceneManager.backgroundMusic.addEventListener("ended", () => {
      SceneManager.playNext(index + 1, shuffledSongs); // Use SceneManager.playNext
      if (index + 1 >= shuffledSongs.length) SceneManager.startPlaylist();
    });
  }

  static startPlaylist() {
    const shuffledSongs = SceneManager.shuffle([...SceneManager.songs]);
    SceneManager.playNext(0, shuffledSongs); // Use SceneManager.playNext
  }
}
