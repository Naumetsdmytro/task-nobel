import { MicroInspector } from "../microInspector.js";

export class QRmicroInspector extends MicroInspector {
  constructor() {
    super();
  }

  handleMicroResult(result) {
    const microContainerEl = document.querySelector(".qr-microphone-container");
    const resultContainerEl = document.querySelector(".qr-result");

    if (result) {
      microContainerEl.style.display = "none";
      resultContainerEl.style.display = "block";

      this.messageDisplayed = true;
      this.sendMicroCheckSignal(this.getUserACId(), true);
    } else {
      this.sendMicroCheckSignal(this.getUserACId(), false);
    }
  }

  async sendMicroCheckSignal(userId, checkResult) {
    fetch(`/microphoneCheck/${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkResult,
      }),
    }).catch((error) => {
      console.error("Error sending camera check request:", error);
    });
  }

  getUserACId() {
    return super.getUserACId();
  }

  async setUserToTechCheckList() {
    super.setUserToTechCheckList();
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
