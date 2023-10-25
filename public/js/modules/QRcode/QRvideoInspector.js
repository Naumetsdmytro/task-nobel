import { VideoInspector } from "../videoInspector.js";

export class QRvideoInspector extends VideoInspector {
  constructor() {
    super();
  }

  handleCameraResult(result) {
    const videoContainerEl = document.querySelector(".tech-camera-container");
    const resultContainerEl = document.querySelector(".qr-result");
    const cameraFailureEl = document.getElementById("camera-failure-text");

    if (result) {
      videoContainerEl.style.display = "none";
      resultContainerEl.style.display = "block";
    } else {
      videoContainerEl.style.display = "none";
      cameraFailureEl.style.display = "block";
    }
  }

  getUserACId() {
    return super.getUserACId();
  }

  async updateUserResult() {
    super.updateUserResult();
    fetch("/phoneCamera")
      .then((response) => response.json())
      .then((data) => console.log(data))
      .catch((error) => console.error("Error:", error.message));
  }

  inspect() {
    super.inspect();
  }
}
