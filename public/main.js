// Elements
const timerContainer = document.querySelector(".countdown");
const signInContainer = document.querySelector(".signIn");
const noEduguest = document.querySelector(".no-eduquest");
const formButton = document.querySelector(".form__btn");
const nameInput = document.querySelector(".form__input");
const spinner = document.querySelector(".spinner");
const signInButton = document.querySelector(".signIn-google");
const timerDays = document.querySelector("span[data-days]");
const timerHours = document.querySelector("span[data-hours]");
const timerMinutes = document.querySelector("span[data-minutes]");
const timerSeconds = document.querySelector("span[data-seconds]");

let timerId = 0;
let spreadSheetId = "";
let roomNumber = 0;
let links = [];
let googleName = "";

// Params
const urlParams = new URLSearchParams(window.location.search);
const signInSuccess = urlParams.get("signInSuccess");

const fetchSpreadSheetData = async () => {
  const response = await fetch("/getData");
  const { data } = await response.json();

  spreadSheetId = data[1];
  roomNumber = data[2];
  links = data[3].split(",");

  const responseDate = await fetch("/currentDateTime");
  const { currentDateTime } = await responseDate.json();
  const currentDate = new Date(currentDateTime);

  const eqDate = new Date(data[0]);
  const updatedLatestDate = new Date(eqDate.getTime() + 90 * 60 * 1000); // add 40 minutes

  if (currentDate.getTime() > updatedLatestDate.getTime()) {
    timerContainer.style.display = "none";
    signInContainer.style.display = "none";
    noEduguest.style.display = "block";
    signInButton.style.display = "none";
  } else if (
    currentDate.getTime() > eqDate &&
    currentDate.getTime() < updatedLatestDate.getTime()
  ) {
    timerContainer.style.display = "none";
    noEduguest.style.display = "none";
    signInContainer.style.display = signInSuccess ? "block" : "none";
    signInButton.style.display = signInSuccess ? "none" : "inline-flex";
  } else if (currentDate.getTime() < eqDate.getTime()) {
    countdownTimer(eqDate);
    signInButton.style.display = "none";
    timerContainer.style.display = "block";
    signInContainer.style.display = "none";
    noEduguest.style.display = "none";
    timerId = setInterval(countdownTimer, 1000, eqDate);
  }
};

fetchSpreadSheetData();

// Form submit
const form = document.querySelector(".form");

form.addEventListener("submit", onFormSubmit);

function onFormSubmit(evt) {
  evt.preventDefault();

  const name = form.elements.name.value;
  const processName = name.split(" ").length > 1 ? name : "";
  const email = form.elements.email.value;

  let room = getRandomNumber(1, roomNumber);
  const sheetName = "Main room " + room;
  if (processName === "" || email === "") {
    //please enter full name
    return;
  }
  formButton.disabled = true;

  formButton.style.display = "none";
  spinner.style.display = "inline-block";

  const isEduquestActive = fetch("/isEduquestActive")
    .then((response) => {
      return response.json();
    })
    .then(({ data }) => {
      console.log(data);
      if (!data) return;

      window.location.href = data;
      return;
    });

  fetch(`/getEmailsFromEntered?spreadsheetId=${spreadSheetId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [email, processName, room],
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then(({ data }) => {
      if (data) {
        const link = links.filter((link, index) => Number(data) === index + 1);
        window.location.href = link[0];
        return;
      }
      const link = links.filter((link, index) => room === index + 1);
      window.location.href = link[0];
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
    .finally(() => {
      formButton.style.display = "inline-flex";
      spinner.style.display = "none";
      formButton.disabled = false;
    });
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

signInButton.addEventListener("click", handleGoogleSignIn);

function handleGoogleSignIn() {
  const authUrl = "/signin/google";

  window.location.href = authUrl;
}

// Check if the URL contains the query parameter indicating successful sign-in
if (signInSuccess === "true") {
  googleName = urlParams.get("googleName");
  fetchSpreadSheetData();
}

// Countdown
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
