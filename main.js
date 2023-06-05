// import { fetchDataSS } from "./fetchSpreadSheetData";

// Elements
const timerContainer = document.querySelector(".timer");
const signInContainer = document.querySelector(".signIn");
const noEduguestContainer = document.querySelector(".noEduquestContainer");

const timerDays = document.querySelector("span[data-days]");
const timerHours = document.querySelector("span[data-hours]");
const timerMinutes = document.querySelector("span[data-minutes]");
const timerSeconds = document.querySelector("span[data-seconds]");

let timerId = 0;
let spreadSheetId = "";
let roomNumber = 0;
const fetchSpreadSheetData = async () => {
  const response = await fetch("http://localhost:3000/getDate");
  const { data } = await response.json();

  const currentDate = new Date();

  const latestDate = data.reduce(
    (latest, [dateString, spreadSheet, roomcount]) => {
      const date = new Date(dateString);
      if (date > latest) {
        spreadSheetId = spreadSheet;
        roomNumber = roomcount;
        return date;
      }
      return latest;
    },
    new Date(0)
  );

  const updatedLatestDate = new Date(
    latestDate.getTime() + 1.5 * 60 * 60 * 1000
  ); // add 1.5 hours

  if (currentDate.getTime() > updatedLatestDate.getTime()) {
    timerContainer.style.display = "none";
    signInContainer.style.display = "none";
    noEduguestContainer.style.display = "block";
  } else if (
    currentDate.getTime() > latestDate &&
    currentDate.getTime() < updatedLatestDate.getTime()
  ) {
    timerContainer.style.display = "none";
    signInContainer.style.display = "block";
    noEduguestContainer.style.display = "none";
  } else if (currentDate.getTime() < latestDate.getTime()) {
    timerContainer.style.display = "block";
    signInContainer.style.display = "none";
    noEduguestContainer.style.display = "none";
    timerId = setInterval(countdownTimer, 1000, Date.parse(latestDate));
  }
};

fetchSpreadSheetData();

// Form submit
const form = document.querySelector(".form");

form.addEventListener("submit", onFormSubmit);

function onFormSubmit(evt) {
  evt.preventDefault();
  const name = form.elements.name.value;
  const email = form.elements.email.value;
  const room = getRandomNumber(1, roomNumber);

  if (name === "" || email === "") return;

  fetch("http://localhost:3000/setData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      spreadsheetId: spreadSheetId,
      data: [email, name, room],
    }),
  })
    .then((response) => {
      if (response.ok) {
        form.reset();
      }
    })
    .catch((error) => {
      console.error("An error occurred:", error);
    });
  //   window.open("", "_blank");no new tab
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    signInContainer.style.display = "block";
    timerContainer.style.display = "none";
    return;
  }
  const { days, hours, minutes, seconds } = convertMs(delta);
  timerDays.textContent = days;
  timerHours.textContent = hours;
  timerMinutes.textContent = minutes;
  timerSeconds.textContent = seconds;
}
