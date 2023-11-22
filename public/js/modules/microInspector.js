export class MicroInspector {
  #matchingWord;

  constructor(matchingWord = "") {
    this.#matchingWord = matchingWord;
    this.messageDisplayed = false;
  }

  #findMatchesInSpeechResults(speechResults) {
    for (const result of Array.from(speechResults)) {
      const transcript = result[0].transcript.trim().toLowerCase();

      if (transcript.trim() !== "") return true;
    }
    return false;
  }

  handleMicroResult(result) {
    const microContainerEl = document.querySelector(
      ".tech-microphone-container"
    );
    const audioContainerEl = document.querySelector(".tech-audio-container");

    if (result) {
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
      const { name, googleName, mainRoomNumber, loginCredential, meetingLink } =
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

      fetch("/getEmailsFromEntered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: loginCredential,
        }),
      })
        .then((response) => {
          return response.json();
        })
        .then(async ({ data }) => {
          if (data) {
            return;
          }

          await fetch("/setData", {
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
          if (findMatchesResult) {
            clearTimeout(timeoutId);
            this.updateUserResult();
            this.handleMicroResult(true);
          }
        }, 9000);
      }
    });

    recognition.start();

    let reloadPage = false;

    const timeoutId = setTimeout(async () => {
      try {
        await this.setUserToTechCheckList();
        this.handleMicroResult(false);

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

// export class MicroInspector {
//   constructor(matchingWord = "") {
//     this.matchingWord = matchingWord;
//     this.messageDisplayed = false;
//   }

//   handleMicroResult() {
//     const microContainerEl = document.querySelector(
//       ".tech-microphone-container"
//     );
//     const audioContainerEl = document.querySelector(".tech-audio-container");

//     audioContainerEl.style.display = "flex";
//     microContainerEl.style.display = "none";
//     this.messageDisplayed = true;
//   }

//   async setUserToTechCheckList() {
//     try {
//       const userACId = this.getUserACId();
//       const userResponse = await fetch(`/users/${userACId}`);
//       const { name, googleName, mainRoomNumber, loginCredential } =
//         await userResponse.json();

//       const dataResponse = await fetch("/getData");
//       const { data } = await dataResponse.json();

//       const sheetName = "Main room " + mainRoomNumber;
//       const spreadSheetId = data[0][1];

//       await fetch("/setData", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sheetName: "Tech check",
//           spreadSheetId,
//           data: [name, googleName, "Failed", mainRoomNumber],
//         }),
//       });

//       await fetch("/setData", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sheetName: "Entered",
//           spreadSheetId,
//           data: [loginCredential, name, googleName, mainRoomNumber],
//         }),
//       });

//       await fetch("/setData", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           sheetName,
//           spreadSheetId,
//           data: [name, googleName],
//         }),
//       });
//     } catch (error) {
//       console.error("Error setting user to tech check list:", error.message);
//     }
//   }

//   async updateUserResult() {
//     try {
//       const userACId = this.getUserACId();
//       const response = await fetch(`/users/${userACId}`);
//       const user = await response.json();

//       await fetch(`users/${userACId}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           camera: true,
//           microphone: true,
//           audio: false,
//           meetingLink: user.meetingLink,
//         }),
//       });
//     } catch (error) {
//       console.error("Error updating user result:", error.message);
//     }
//   }

//   async inspect() {
//     const timeoutInSeconds = 25;
//     let isMicrophoneWorking = false;

//     const microphoneBackdropEl = document.getElementById("microphone-check");
//     microphoneBackdropEl.style.display = "flex";

//     try {
//       const userACId = this.getUserACId();

//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioContext = new (window.AudioContext ||
//         window.webkitAudioContext)();
//       const analyser = audioContext.createAnalyser();
//       analyser.fftSize = 256;

//       const source = audioContext.createMediaStreamSource(stream);
//       source.connect(analyser);

//       const dataArray = new Uint8Array(analyser.frequencyBinCount);
//       const buffer = [];

//       const checkMicrophone = () => {
//         analyser.getByteFrequencyData(dataArray);
//         const average =
//           dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;

//         // Check if the volume exceeds the threshold
//         if (average > 0.01) {
//           buffer.push(true);
//         } else {
//           buffer.push(false);
//         }

//         // Keep only the last 10 samples to check for sustained sound
//         if (buffer.length > 10) {
//           buffer.shift();
//         }

//         // If all the last 10 samples indicate sound, consider the microphone as working
//         if (buffer.every((value) => value)) {
//           isMicrophoneWorking = true;
//         }
//       };

//       const intervalId = setInterval(checkMicrophone, 5000);

//       const timeoutId = setTimeout(async () => {
//         clearInterval(intervalId);
//         if (!isMicrophoneWorking) {
//           window.location.href = `${window.location.href}&techCheck=failed`;
//         } else {
//           this.updateUserResult();
//           this.handleMicroResult();
//         }
//       }, timeoutInSeconds * 1000);
//     } catch (error) {
//       console.error("Error in inspect:", error);
//       // Handle errors, e.g., when the user denies microphone access
//       // You might want to show a message to the user about enabling microphone access
//     }
//   }

//   getUserACId() {
//     const currentUrl = window.location.href;
//     const match = currentUrl.match(/\/(\w+)(?:\?.*)?$/);
//     return match ? match[1] : null;
//   }
// }
