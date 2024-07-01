import SceneManager from "./assets/Classes/SceneManager.js";
import * as THREE from "three";
const loadingManager = new THREE.LoadingManager();

let navigation = document.querySelectorAll(".navigation li a");
let hoverelement = document.querySelector(".hover-element");
let diaryNavigationElement = document.querySelector("#diaryNavigationElement");
let active = document.querySelector(".navigation li a.active");
let overlay = document.querySelector(".overlay");
let loadingScreen = document.querySelector(".loading-screen");
let progressBar = document.querySelector(".film img");
let progressBarCanvas = document.querySelector("#progress-bar-container");
let loaded = false;
let musicIsPlaying = false;
let initLoadProgress = 0;
let lastProgress = 0;

// Loading Manager Callbacks
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
  const progress = itemsLoaded / itemsTotal;
  updateLoadingProgress(progress);
};

loadingManager.onLoad = function () {
  scene.animate();
  loaded = true;
};

function updateLoadingProgress(progress) {
  lastProgress = progress;
}

function loadTo(progress) {
  progressBar.style.marginLeft = `${(progress - 1) * 100}%`;
}

async function updateLoader() {
  if (
    initLoadProgress < 0.1 ||
    (initLoadProgress < 1 && lastProgress > initLoadProgress)
  ) {
    loadTo(initLoadProgress);
    initLoadProgress += 0.05;
  } else if (loaded) {
    loadTo(1);
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 1000);
    return;
  }

  setTimeout(() => {
    updateLoader();
  }, 100);
}

updateLoader();

let scene = new SceneManager(loadingManager);

navigation.forEach((nav) => {
  nav.addEventListener("mouseover", () => moveNavigation(nav));
  nav.addEventListener("mouseleave", () => moveNavigation());
  nav.addEventListener("click", () => changeNavigation(nav));
  moveNavigation();
});

function moveNavigation(element = active) {
  hoverelement.style.left = element.offsetLeft + "px";
  hoverelement.style.width = element.clientWidth + "px";
  hoverelement.style.height = element.clientHeight + "px";
}

function changeNavigation(element) {
  if (element.getAttribute("data-id")) {
    pauseScene();
  } else {
    unpauseScene();
  }

  toggleNavigation(element);
}

function toggleNavigation(element) {
  if (!musicIsPlaying) {
    SceneManager.startPlaylist();
    musicIsPlaying = true;
  }

  overlay.querySelectorAll(".container").forEach((section) => {
    if (section.id == element.getAttribute("data-id")) {
      section.style.display = "block";
    } else if (section.style.display == "block") {
      section.style.display = "none";
    }
  });

  active.classList.remove("active");
  element.classList.add("active");
  active = element;
  moveNavigation(element);

  if (element.getAttribute("data-id") == undefined) {
    progressBarCanvas.style.display = "block";
  } else {
    progressBarCanvas.style.display = "none";
  }
}

document.querySelectorAll(".close").forEach((closeBtn) => {
  closeBtn.addEventListener("click", () => {
    unpauseScene();
    toggleNavigation(diaryNavigationElement);
  });
});

document.querySelector(".overlay").addEventListener("click", (e) => {
  if (e.target.classList.contains("overlay")) {
    unpauseScene();
    toggleNavigation(diaryNavigationElement);
  }
});

function pauseScene() {
  scene.pause();
  overlay.style.display = "flex";
}
function unpauseScene() {
  scene.unpause();
  overlay.style.display = "none";
}
