export class VideoInspector {
  #startVideoDetection() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = document.querySelector("video");
        if ("srcObject" in video) {
          video.srcObject = stream;
        } else {
          video.src = window.URL.createObjectURL(stream);
        }
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  }

  handleCameraResult() {
    const videoContainerEl = document.querySelector(".tech-camera-container");
    const microContainerEl = document.querySelector(
      ".tech-microphone-container"
    );

    videoContainerEl.style.display = "none";
    microContainerEl.style.display = "flex";
  }

  getUserACId() {
    const currentUrl = window.location.href;
    const match = currentUrl.match(/\/(\w+)(?:\?.*)?$/);
    if (match) {
      return match[1];
    }
    return null;
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
      }),
    });
  }

  inspect() {
    const timeoutInSeconds = 35;

    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("../../face-api-models/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri(
        "../../face-api-models/models"
      ),
      faceapi.nets.faceRecognitionNet.loadFromUri(
        "../../face-api-models/models"
      ),
      faceapi.nets.faceExpressionNet.loadFromUri(
        "../../face-api-models/models"
      ),
    ]).then(this.#startVideoDetection);

    const intervalId = setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 0) {
        await this.updateUserResult();
        clearInterval(intervalId);
        clearTimeout(timeoutId);

        this.handleCameraResult(true);
      }
    }, 2000);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);

      const currentURL = window.location.href;
      window.location.href = `${currentURL}&techCheck=failed`;
    }, timeoutInSeconds * 1000);
  }
}
