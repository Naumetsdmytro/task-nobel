// ELEMENTS
const timerContainer = document.querySelector(".countdown");
const signInContainer = document.querySelector(".signIn");
const noEduguest = document.querySelector(".no-eduquest");
const techCheckContainer = document.querySelector(".tech-check");
const techCameraContainer = document.querySelector(".tech-camera-container");
const failureEl = document.getElementById("failure-text");
const techMicroContainer = document.querySelector(".tech-microphone-container");
const audioForm = document.querySelector(".audio-form");
const audioFailureTextEl = document.querySelector(".audio-failure-text");
const failureLinks = document.querySelectorAll("#failure-link");
const form = document.querySelector(".form");
const formButton = document.querySelector(".form__btn");
const nameInput = document.querySelector(".form__input");
const spinners = document.querySelectorAll(".spinner");
const headerTitles = document.querySelectorAll(".heading__title");
const signInButton = document.querySelector(".signIn-google");
const timerDays = document.querySelector("span[data-days]");
const timerHours = document.querySelector("span[data-hours]");
const timerMinutes = document.querySelector("span[data-minutes]");
const timerSeconds = document.querySelector("span[data-seconds]");
const retryForm = document.querySelector(".retry-check-form");

// ETC VARIABLES
let timerId = 0;
let spreadSheetId = "";
let roomNumber = 0;
let links = [];
let googleName = "";

// PARAMS
export function getParamValue(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

//SHOWING INTERFACE LOGIC
const fetchSpreadSheetData = async (data) => {
  headerTitles.forEach((title) => {
    title.textContent = `${data[4]} Eduquest`;
  });

  spreadSheetId = data[1];
  roomNumber = data[2];
  links = data[3].split(",");

  const responseDate = await fetch("/currentDateTime");
  const { currentDateTime } = await responseDate.json();
  const currentDate = new Date(currentDateTime);

  const eqDate = new Date(data[0]);
  const updatedLatestDate = new Date(eqDate.getTime() + 20 * 60 * 1000); // add 20 minutes

  if (currentDate.getTime() > updatedLatestDate.getTime()) {
    timerContainer.style.display = "none";
    signInContainer.style.display = "none";
    noEduguest.style.display = "block";
  } else if (
    currentDate.getTime() > eqDate &&
    currentDate.getTime() < updatedLatestDate.getTime()
  ) {
    timerContainer.style.display = "none";
    noEduguest.style.display = "none";
    signInContainer.style.display = "block";
  } else if (currentDate.getTime() < eqDate.getTime()) {
    countdownTimer(eqDate);
    timerContainer.style.display = "block";
    signInContainer.style.display = "none";
    noEduguest.style.display = "none";
    timerId = setInterval(countdownTimer, 1000, eqDate);
  }
};

// "JOIN"-FORM SUBMIT
form.addEventListener("submit", onJoinFormSubmit);

async function onJoinFormSubmit(evt) {
  evt.preventDefault();
  const name = form.elements.name.value;
  const processName = name.split(" ").length > 1 ? name : "";
  const email = form.elements.email.value;

  let room = await getRandomNumber(1, roomNumber);
  const sheetName = "Main room " + room;
  if (processName === "" || email === "") {
    return;
  }
  formButton.disabled = true;

  formButton.style.display = "none";
  showSpinner();

  fetch("/isEduquestActive")
    .then((response) => {
      return response.json();
    })
    .then(({ data }) => {
      if (data[0] === true && getParamValue("signInSuccess") === "true") {
        fetch("/getEmailsFromEntered", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: email,
          }),
        })
          .then((response) => {
            return response.json();
          })
          .then(async ({ data }) => {
            if (data) {
              return;
            }
            form.reset();
            fetch("/setData", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sheetName: "Entered",
                spreadsheetId: spreadSheetId,
                data: [email, processName, googleName, room],
              }),
            }).catch((error) => {
              console.log(error.message);
            });
            fetch("/setData", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sheetName,
                spreadsheetId: spreadSheetId,
                data: [processName, googleName],
              }),
            }).catch((error) => {
              console.log(error.message);
            });
          })
          .catch((error) => {
            console.log(error.message);
          })
          .finally(async () => {
            hideSpinner();
            formButton.style.display = "inline-flex";

            const urlId = generateIdForURL();

            const response = await fetch("/users");
            const users = await response.json();

            const user = users.find((user) => user.id === urlId);
            if (!user) {
              await fetch("users", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: urlId,
                  meetingLink: links[room - 1],
                }),
              });
            }
            techCheckContainer.style.display = "block";
            signInContainer.style.display = "none";
            formButton.disabled = false;
          });
      } else {
        window.location.href = data[1];
      }
    });
}

async function getRandomNumber(min, maxNumber) {
  const response = await fetch("/getNextRoomNumber", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      maxNumber,
    }),
  });
  const { roomNumber } = await response.json();
  return roomNumber;
}

function generateIdForURL() {
  const currentUrl = window.location.href;
  const idRegex = /\/(\d+)(?:\?.*)?/;
  const hasId = currentUrl.match(idRegex);

  if (!hasId) {
    const searchParams = new URLSearchParams(window.location.search);

    const pathname = window.location.pathname.endsWith("/")
      ? window.location.pathname.slice(0, -1)
      : window.location.pathname;

    const id = generateUniqueId();
    const newUrl = `${
      window.location.origin
    }${pathname}/${id}?${searchParams.toString()}&generatedId=true`;
    window.history.replaceState({}, "", newUrl);
    return id;
  }

  return hasId[1];
}

function generateUniqueId() {
  return (
    new Date().getTime().toString(36).slice(-6) +
    Math.random().toString(36).slice(2, 8)
  );
}

// TECH-CHECK FORM SUBMIT
audioForm.addEventListener("submit", onAudioFormSubmit);

async function onAudioFormSubmit(evt) {
  evt.preventDefault();
  const inputValue = evt.target.elements.audioCheck.value.trim().toLowerCase();
  console.log(inputValue);
  if (inputValue !== "21" && inputValue !== "twenty one") {
    console.log("bad");
    audioFailureTextEl.style.display = "block";
    return;
  }

  const userACId = getUserACId();

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
      audio: true,
      meetingLink: user.meetingLink,
    }),
  });
  window.location.href = user.meetingLink;
}

function getUserACId() {
  const currentUrl = window.location.href;
  const match = currentUrl.match(/\/(\w+)(?:\?.*)?$/);
  if (match) {
    return match[1];
  }
  return null;
}

// GOOGLE SIGN IN
signInButton.addEventListener("click", handleGoogleSignIn);

function handleGoogleSignIn() {
  const currentURL = window.location.href;
  const parts = currentURL.split("/");
  const userId = parts[parts.length - 1];

  const redirectUrl = `/signin/google?userId=${userId}`;
  window.location.href = redirectUrl;
}

async function paramsInterfaceLogic() {
  const techCheck = getParamValue("techCheck");
  const signInSuccess = getParamValue("signInSuccess");
  const generatedId = getParamValue("generatedId");

  if (signInSuccess && !techCheck && !generatedId) {
    googleName = getParamValue("googleName");
    signInButton.style.display = "none";
    await activeCampaignLogic();
  }
  if (techCheck) {
    disableBackButton();

    signInButton.style.display = "none";
    signInContainer.style.display = "none";
    techCameraContainer.style.display = "none";
    techCheckContainer.style.display = "block";
    failureEl.style.display = "block";
  }
  if (generatedId) {
    techCheckContainer.style.display = "block";
  }
}
function disableBackButton() {
  window.history.forward(); // Make sure they can't go back
  setTimeout(disableBackButton, 1);
}

paramsInterfaceLogic();

// ACTIVE CAMPAIGN
async function activeCampaignLogic() {
  try {
    showSpinner();

    const responseDate = await fetch("/currentDateTime");
    const { currentDateTime } = await responseDate.json();
    const currentDate = new Date(currentDateTime);

    const response = await fetch("/getData");
    const { data } = await response.json();
    failureLinks.forEach((link) => {
      link.href = data[0][6];
    });
    const eqDate = new Date(data[0][0]);
    const processedEQDate = new Date(eqDate.getTime() + 90 * 60 * 1000);

    if (processedEQDate.getTime() < currentDate.getTime()) {
      showNoUpcomingEQ();
      return;
    }

    const internId = getUserACId();
    if (!internId) {
      fetchSpreadSheetData(data[0]);
      return;
    }
    const closestInternsList = data[0][7];

    const isInternExist = closestInternsList.find((intern) => {
      if (intern.id === internId) {
        fetchSpreadSheetData(data[0]);
        return intern;
      }
    });

    if (!isInternExist) {
      const futureEQ = await checkInternInFutureEQs(internId);
      futureEQ
        ? fetchSpreadSheetData(futureEQ)
        : retryInternCheck(closestInternsList, data);
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    hideSpinner();
  }
}

async function checkInternInFutureEQs(internId) {
  const response = await fetch("/checkInternInFutureEQ", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      internId,
    }),
  });
  const { futureEQ } = await response.json();
  return futureEQ;
}

function retryInternCheck(closestInternsList, data) {
  retryForm.style.display = "block";

  retryForm.addEventListener("submit", onRetryCheckFormSubmit);

  async function onRetryCheckFormSubmit(evt) {
    evt.preventDefault();

    const button = evt.target.elements.retryButton;
    button.style.display = "none";

    showSpinner();

    const internId = evt.target.elements.acId.value;

    const isInternExist = closestInternsList.find((intern) => {
      if (intern.id === internId) {
        fetchSpreadSheetData(data[0]);
        return intern;
      }
    });

    if (!isInternExist) {
      const futureEQ = await checkInternInFutureEQs(internId);
      retryForm.style.display = "none";
      futureEQ ? fetchSpreadSheetData(futureEQ) : showNoUpcomingEQ();
    }
    hideSpinner();
  }
}

function showNoUpcomingEQ() {
  noEduguest.style.display = "block";
}

// COUNTDOWN
function addLeadingZero(value) {
  return String(value).padStart(2, "0");
}

function convertMs(ms) {
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const days = addLeadingZero(Math.floor(ms / day));
  const hours = addLeadingZero(Math.floor((ms % day) / hour));
  const minutes = addLeadingZero(Math.floor(((ms % day) % hour) / minute));
  const seconds = addLeadingZero(
    Math.floor((((ms % day) % hour) % minute) / second)
  );
  return { days, hours, minutes, seconds };
}

function countdownTimer(toDate) {
  const now = Date.now();

  const delta = toDate - now;

  if (delta < 0) {
    clearInterval(timerId);
    fetchSpreadSheetData();
    return;
  }
  const { days, hours, minutes, seconds } = convertMs(delta);
  timerDays.textContent = days;
  timerHours.textContent = hours;
  timerMinutes.textContent = minutes;
  timerSeconds.textContent = seconds;
}

//SPINNER
function showSpinner() {
  spinners.forEach((spinner) => {
    spinner.style.display = "inline-block";
  });
}

function hideSpinner() {
  spinners.forEach((spinner) => {
    spinner.style.display = "none";
  });
}
