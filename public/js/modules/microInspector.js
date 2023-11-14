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

  async setUserToTechCheckList() {
    try {
      const userACId = this.getUserACId();
      const userResponse = await fetch(`/users/${userACId}`);
      const { name, googleName, mainRoomNumber, loginCredential } =
        await userResponse.json();

      const dataResponse = await fetch("/getData");
      const { data } = await dataResponse.json();

      const sheetName = "Main room " + mainRoomNumber;
      const spreadSheetId = data[0][1];

      await fetch("/setData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetName: "Tech check",
          spreadSheetId,
          data: [name, googleName, "Failed", mainRoomNumber],
        }),
      });

      fetch("/setData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetName: "Entered",
          spreadSheetId,
          data: [loginCredential, name, googleName, mainRoomNumber],
        }),
      });

      await fetch("/setData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetName,
          spreadSheetId,
          data: [name, googleName],
        }),
      });
    } catch (error) {
      console.log(error.message);
    }
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
    const timeoutInSeconds = 25;
    let recognition;

    if ("SpeechRecognition" in window) {
      recognition = new window.SpeechRecognition();
    } else if ("webkitSpeechRecognition" in window) {
      recognition = new window.webkitSpeechRecognition();
    } else {
      console.log("Speech recognition not supported in this browser");
    }

    const microphoneBackdropEl = document.getElementById("microphone-check");
    microphoneBackdropEl.style.display = "flex";

    recognition.lang = "en-US";
    recognition.interimResults = true;
    let recognitionTimeout;

    recognition.addEventListener("result", (e) => {
      if (!this.messageDisplayed) {
        clearTimeout(recognitionTimeout);
        const speechRecognitionResults = e.results;
        const findMatchesResult = this.#findMatchesInSpeechResults(
          speechRecognitionResults
        );

        recognitionTimeout = setTimeout(() => {
          if (findMatchesResult === "Russia") {
            clearTimeout(timeoutId);
            this.handleMicroResult(false);
            return;
          }
          if (findMatchesResult) {
            clearTimeout(timeoutId);
            this.updateUserResult();
            this.handleMicroResult(true);
          }
        }, 7000);
      }
    });

    recognition.start();

    let reloadPage = false;

    const timeoutId = setTimeout(async () => {
      try {
        await this.setUserToTechCheckList();

        reloadPage = true;
      } catch (error) {
        console.error("Error in setTimeout callback:", error);
      } finally {
        if (reloadPage) {
          const currentURL = window.location.href;
          window.location.href = `${currentURL}&techCheck=failed`;
        }
      }
    }, timeoutInSeconds * 1000);
  }
}
