import { MicroInspector } from "./microInspector.js";
import { VideoInspector } from "./videoInspector.js";
import { getParamValue } from "../main.js";

const microCheckButtonEl = document.getElementById("micro-check-btn");
const cameraCheckButtonEl = document.getElementById("camera-check-btn");
const cameraQREl = document.querySelector("#qr-camera");
const microphoneQREl = document.querySelector("#qr-microphone");
const cameraQRTextEl = document.querySelector("#qr-camera-text");
const microphoneQRTextEl = document.querySelector("#qr-microphone-text");
const deviceInfoText = document.querySelector(".device-info-text");
const contentContainer = document.querySelector(".content");
const signInButtonEl = document.querySelector(".signIn-google");

function startInspections() {
  const isDesktop = performDeviceCheck();
  const cameraParam = getParamValue("camera");
  const microParam = getParamValue("microphone");
  const signInSuccess = getParamValue("signInSuccess");

  if (isDesktop && !cameraParam && !microParam) {
    if (!signInSuccess) {
      signInButtonEl.style.display = "inline-flex";
    }
    const videoInspector = new VideoInspector();
    const microInspector = new MicroInspector();

    microCheckButtonEl.addEventListener("click", () => {
      microInspector.inspect();
    });

    cameraCheckButtonEl.addEventListener("click", () => {
      videoInspector.inspect();
    });

    cameraQREl.addEventListener("click", (evt) => {
      if (evt.target.id === "qr-camera") {
        cameraQREl.style.display = "none";
      }
    });

    microphoneQREl.addEventListener("click", (evt) => {
      if (evt.target.id === "qr-microphone") {
        microphoneQREl.style.display = "none";
      }
    });

    cameraQRTextEl.addEventListener("click", () => {
      cameraQREl.style.display = "flex";
    });

    microphoneQRTextEl.addEventListener("click", () => {
      microphoneQREl.style.display = "flex";
    });
  } else {
    contentContainer.style.display = "none";
    deviceInfoText.style.display = "block";
  }
}

function isDesktopOrLaptop() {
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const hasTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;
  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

  return !isMobileDevice && screenWidth > 1024 && !hasTouch;
}

function performDeviceCheck() {
  const isDesktop = isDesktopOrLaptop();
  return isDesktop ? true : false;
}

window.addEventListener("load", startInspections);
