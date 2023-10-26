import { MicroInspector } from "../microInspector.js";

export class QRmicroInspector extends MicroInspector {
  constructor() {
    super();
  }

  handleMicroResult(result) {
    const microBackdropEl = document.getElementById("microphone-check");
    const microContainerEl = document.querySelector(".qr-microphone-container");
    const resultContainerEl = document.querySelector(".qr-result");
    const microFailureEl = document.getElementById("microphone-failure-text");
    const imgPutinEl = document.querySelector(".putin");

    if (result === "Russia") {
      console.log("bad");
      microBackdropEl.style.display = "none";
      microContainerEl.style.display = "none";
      imgPutinEl.style.display = "block";
    } else if (!result) {
      console.log("bad 2");
      microContainerEl.style.display = "none";
      microFailureEl.style.display = "block";
      microBackdropEl.style.display = "none";
    } else {
      microContainerEl.style.display = "none";
      resultContainerEl.style.display = "block";
      this.messageDisplayed = true;
    }
  }

  getUserACId() {
    return super.getUserACId();
  }

  async updateUserResult() {
    const userACId = this.getUserACId();

    const response = await fetch(`/users/${userACId}`);
    const user = await response.json();

    await fetch(`users/${userACId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        camera: true,
        microphone: true,
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
