import * as THREE from "three";
import Project from "./Project.js";
import Text from "./Text.js";
import ProgressLine from "./ProgressLine.js";
import Camera from "./Camera.js";

const MAX_CHAR_PER_LINE = 40;
const SPACING_BETWEEN_PROJECTS = 15;
const SPACING_BETWEEN_IMAGES = 2;
const MAX_IMAGE_WIDTH = 20;
const PROGRESS_LINE_OFFSET = 4;
const IMAGE_PROXIMITY_MARGIN = 2; // Adjust the margin value as needed

export default class Projects {
  static loaded = false;

  constructor(scene) {
    this.scene = scene;
    this.projectEntries = [];
    this.progressLines = [];
    this.isTopViewActive = false; // Flag to track if top view is active
    this.init();
  }

  async init() {
    await this.loadProjects();
    this.renderProjects();
  }

  async loadProjects() {
    try {
      const response = await fetch("assets/projects.json");
      const projects = await response.json();

      for (const projectData of projects) {
        const project = new Project(projectData);

        if (projectData.sound) {
          const listener = new THREE.AudioListener();
          this.scene.add(listener);

          const sound = new THREE.Audio(listener);
          const audioLoader = new THREE.AudioLoader();
          await new Promise((resolve, reject) => {
            audioLoader.load(
              projectData.sound,
              (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.5);
                resolve();
              },
              undefined,
              reject
            );
          });

          project.sound = sound;
        }

        if (projectData.images) {
          project.imageHeights = await this.loadImages(
            projectData.images,
            projectData.imagesFolder,
            project
          );
        }

        this.projectEntries.push(project);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  }

  async renderProjects() {
    let lastBottomPosition = 16;

    for (let i = 0; i < this.projectEntries.length; i++) {
      const project = this.projectEntries[i];
      const position = { x: 0, y: 0, z: lastBottomPosition };
      const projectHeight = this.renderProject(project, position);
      lastBottomPosition += projectHeight;

      if (i < this.projectEntries.length - 1) {
        const nextProject = this.projectEntries[i + 1];
        nextProject.startPosition =
          lastBottomPosition + SPACING_BETWEEN_PROJECTS;
        project.endPosition = lastBottomPosition;

        const start = new THREE.Vector3(
          0,
          0,
          project.endPosition + PROGRESS_LINE_OFFSET
        );
        const end = new THREE.Vector3(
          0,
          0,
          nextProject.startPosition - PROGRESS_LINE_OFFSET
        );
        this.createProgressLine(start, end);
      }

      lastBottomPosition += SPACING_BETWEEN_PROJECTS;
    }

    Projects.loaded = true;
    Camera.lastElementPosition = lastBottomPosition;
  }

  renderProject(project, position) {
    project.startPosition = position.z;
    const textHeight = this.addText(project, position);
    const imageHeights = project.imageHeights || [];
    const totalHeight = textHeight + this.getTotalImageHeight(imageHeights);
    project.endPosition = position.z + totalHeight;

    this.calculateImageRanges(project, imageHeights, position.z + textHeight);

    // Reintroduced renderImages call to ensure images are rendered
    this.renderImages(project, position, textHeight, imageHeights);

    return totalHeight;
  }

  renderImages(project, position, textHeight, imageHeights) {
    if (!project.imageMeshes) return;
    let lastMeshBottom = position.z + textHeight + 1.5;

    for (const [index, imageMesh] of project.imageMeshes.entries()) {
      const height = imageHeights[index];
      const zPos = lastMeshBottom + height / 2 + SPACING_BETWEEN_IMAGES;
      imageMesh.mesh.position.set(position.x, position.y, zPos);
      imageMesh.mesh.rotation.x = -Math.PI / 2; // Ensure the mesh lies flat
      lastMeshBottom += height + SPACING_BETWEEN_IMAGES;
      this.scene.add(imageMesh.mesh);
    }
  }

  calculateImageRanges(project, imageHeights, startZ) {
    project.imageRanges = [];
    let currentZ = startZ;

    imageHeights.forEach((height) => {
      const range = {
        start: currentZ,
        end: currentZ + height + SPACING_BETWEEN_IMAGES,
      };
      project.imageRanges.push(range);
      currentZ = range.end;
    });
  }
  async loadImages(images, imagesFolder, project) {
    const imageHeights = [];
    const loader = new THREE.TextureLoader();

    for (const [index, image] of images.entries()) {
      const imageURL = `${imagesFolder}/${image}`;
      await new Promise((resolve, reject) => {
        loader.load(
          imageURL,
          (texture) => {
            const material = new THREE.MeshStandardMaterial({
              map: texture,
              transparent: true, // Allow transparency
              opacity: 0, // Start with invisible image
              depthWrite: false, // Ensure the image is rendered on top
            });
            const aspectRatio = texture.image.width / texture.image.height;
            const width = MAX_IMAGE_WIDTH;
            const height = MAX_IMAGE_WIDTH / aspectRatio;
            imageHeights.push(height);

            const geometry = new THREE.PlaneGeometry(width, height);
            const mesh = new THREE.Mesh(geometry, material);

            // Store the mesh for later animation
            project.imageMeshes = project.imageMeshes || [];
            project.imageMeshes.push({ mesh, targetY: 0, index });

            resolve();
          },
          undefined,
          reject
        );
      });
    }

    return imageHeights;
  }

  addText(project, position) {
    let textHeight = 1;

    const descriptionLines = this.splitDescription(
      project.description,
      MAX_CHAR_PER_LINE
    );
    new Text(
      this.scene,
      `${project.date} - ${project.title}`,
      { x: position.x, y: position.y, z: position.z },
      1,
      0.1,
      true
    );
    descriptionLines.forEach((line, index) => {
      new Text(
        this.scene,
        line,
        { x: position.x, y: position.y, z: position.z + 1.5 + index * 0.7 },
        0.5,
        0,
        true
      );
      textHeight += 0.7;
    });

    return textHeight;
  }

  splitDescription(text, maxChar) {
    const lines = [];
    let currentLine = "";

    text.split(" ").forEach((word) => {
      if ((currentLine + word).length > maxChar) {
        lines.push(currentLine.trim());
        currentLine = word + " ";
      } else {
        currentLine += word + " ";
      }
    });

    if (currentLine.trim().length > 0) {
      lines.push(currentLine.trim());
    }

    return lines;
  }

  getTotalImageHeight(imageHeights) {
    if (imageHeights.length === 0) return 0;
    const totalHeight =
      imageHeights.reduce(
        (acc, height) => acc + height + SPACING_BETWEEN_IMAGES,
        0
      ) - SPACING_BETWEEN_IMAGES;
    return totalHeight;
  }

  checkCharacterProximity(character, camera) {
    if (!character.mesh) return;

    const characterPosition = character.mesh.position;
    let isCloseToAnyImage = false;
    let currentProject = null;

    for (const project of this.projectEntries) {
      if (!project.imageRanges || project.imageRanges.length === 0) continue;

      for (let i = 0; i < project.imageRanges.length; i++) {
        const range = project.imageRanges[i];

        if (
          characterPosition.z >= range.start - IMAGE_PROXIMITY_MARGIN &&
          characterPosition.z <= range.end + IMAGE_PROXIMITY_MARGIN
        ) {
          if (
            project.imageMeshes &&
            project.imageMeshes[i] &&
            project.imageMeshes[i].mesh
          ) {
            const imageMesh = project.imageMeshes[i].mesh;

            if (!imageMesh.isDeveloped) {
              isCloseToAnyImage = true; // Set the flag if any image is close
              if (imageMesh.startTime === null) {
                imageMesh.startTime = performance.now(); // Set the start time if not already set
              }

              // Ensure startTime is a valid number
              if (!imageMesh.startTime) {
                imageMesh.startTime = performance.now();
              }

              // Calculate opacity for development
              const elapsedTime =
                (performance.now() - imageMesh.startTime) / 1000;
              const duration = 2; // Duration of the animation in seconds
              const progress = Math.min(elapsedTime / duration, 1);
              imageMesh.material.opacity = progress;

              if (progress >= 1) {
                imageMesh.isDeveloped = true; // Mark this image as developed
              }
            } else {
              isCloseToAnyImage = true; // Keep top view if at least one image is close
            }
            currentProject = project;
          }
        }
      }
    }

    this.handleCameraView(isCloseToAnyImage, camera, currentProject);
    this.updateProgressLines(characterPosition.z);
  }
  handleCameraView(isCloseToAnyImage, camera, currentProject) {
    if (isCloseToAnyImage) {
      if (!this.isTopViewActive) {
        if (currentProject.sound) {
          currentProject.playSound();
        }
        camera.setTopView(true);
        this.isTopViewActive = true;
      }
    } else {
      if (this.isTopViewActive) {
        camera.setTopView(false);
        this.isTopViewActive = false;
      }
    }
  }

  createProgressLine(start, end) {
    const progressLine = new ProgressLine(this.scene, start, end);
    this.progressLines.push(progressLine);
  }

  updateProgressLines(zPos) {
    for (const line of this.progressLines) {
      line.updateLine(zPos);
    }
  }
}
