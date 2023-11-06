export class MicroInspector {
  #matchingWord;

  constructor(matchingWord = "") {
    this.#matchingWord = matchingWord;
    this.messageDisplayed = false;
  }

  #findMatchesInSpeechResults(speechResults) {
    for (const result of Array.from(speechResults)) {
      const transcript = result[0].transcript.trim().toLowerCase();

      if (transcript.includes("russia") || transcript.includes("belarus")) {
        return "Russia";
      }
      if (transcript.trim() !== "") return true;
    }
    return false;
  }

  handleMicroResult(result) {
    const microBackdropEl = document.getElementById("microphone-check");
    const microContainerEl = document.querySelector(
      ".tech-microphone-container"
    );
    const audioContainerEl = document.querySelector(".tech-audio-container");
    const imgPutinEl = document.querySelector(".putin");

    if (!result) {
      microBackdropEl.style.display = "none";
      microContainerEl.style.display = "none";
      imgPutinEl.style.display = "block";
    } else {
      audioContainerEl.style.display = "flex";
      microContainerEl.style.display = "none";
      this.messageDisplayed = true;
    }
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
      }),
    });
  }

  inspect() {
    const timeoutInSeconds = 35;

    window.SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new window.SpeechRecognition();

    const microphoneBackdropEl = document.getElementById("microphone-check");
    microphoneBackdropEl.style.display = "flex";

    recognition.lang = "en-US";
    recognition.interimResults = true;
    let recognitionTimeout;

    recognition.addEventListener("result", (e) => {
      if (!this.messageDisplayed) {
        clearTimeout(recognitionTimeout);
        const speechRecognitionResults = e.results;
        const findMathcesResult = this.#findMatchesInSpeechResults(
          speechRecognitionResults
        );

        recognitionTimeout = setTimeout(() => {
          if (findMathcesResult === "Russia") {
            clearTimeout(timeoutId);
            this.handleMicroResult(false);
            return;
          }
          if (findMathcesResult) {
            clearTimeout(timeoutId);
            this.updateUserResult();
            this.handleMicroResult(true);
          }
        }, 7000);
      }
    });

    recognition.start();

    const timeoutId = setTimeout(() => {
      const currentURL = window.location.href;
      window.location.href = `${currentURL}&techCheck=failed`;
    }, timeoutInSeconds * 1000);
  }
}
