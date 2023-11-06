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
      this.sendCameraCheckSuccessSignal(this.getUserACId());
    } else {
      videoContainerEl.style.display = "none";
      cameraFailureEl.style.display = "block";
    }
  }

  async sendCameraCheckSuccessSignal(userId) {
    fetch(`/cameraCheckSuccess/${userId}`, {
      method: "POST",
    }).catch((error) => {
      console.error("Error sending camera check request:", error);
    });
  }

  getUserACId() {
    return super.getUserACId();
  }

  async updateUserResult() {
    const response = await fetch("/users");
    const users = await response.json();
    console.log(users);

    const userACId = this.getUserACId();
    const user = users.find((user) => user.id === userACId);

    await fetch(`users/${userACId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        camera: true,
        microphone: false,
        audio: false,
        meetingLink: user.meetingLink,
        isPossibleToUsePhone: false,
      }),
    });
  }

  inspect() {
    super.inspect();
  }
}
