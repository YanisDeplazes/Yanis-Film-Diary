import SceneManager from "./SceneManager.js";

export default class Project {
  constructor(projectData) {
    this.title = projectData.title;
    this.date = projectData.date;
    this.description = projectData.description;
    this.imagesFolder = projectData.imagesFolder;
    this.images = Array.isArray(projectData.images) ? projectData.images : [];
    this.imageCoordinates = [];
    this.progress = 0;
    this.startPosition = 0;
    this.endPosition = 0;
    this.isSoundPlaying = false;
    this.soundStartTime = null;
    this.soundTimeoutId = null;
    this.imagesDropped = new Array(this.images.length).fill(false);
  }
  playSound() {
    if (this.sound && !this.sound.isPlaying) {
      const bgm = SceneManager.backgroundMusic;
      this.sound.setLoop(false);

      if (bgm) {
        this.adjustVolume(bgm, 0.1, 0.2);
      }

      this.sound.play();
      this.sound.isPlaying = true;

      this.sound.source.onended = () => {
        this.sound.stop();
        this.sound.isPlaying = false; /* sets Three wrapper property correctly */
        if (bgm) {
          this.adjustVolume(bgm, 0.2, 0.2);
        }
        // Reset the sound source so it can be played again
        this.sound.source = this.sound.context.createBufferSource();
        this.sound.source.buffer = this.sound.buffer;
        this.sound.source.connect(this.sound.context.destination);
      };
    }
  }

  adjustVolume(audio, targetVolume, duration) {
    const step = (targetVolume - audio.volume) / ((duration * 1000) / 50);
    const fadeInterval = setInterval(() => {
      audio.volume =
        Math.abs(targetVolume - audio.volume) < Math.abs(step)
          ? targetVolume
          : audio.volume + step;
      if (audio.volume === targetVolume) {
        clearInterval(fadeInterval);
      }
    }, 50);
  }
}
