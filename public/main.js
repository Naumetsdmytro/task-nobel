// ELEMENTS
const timerContainer = document.querySelector(".countdown");
const signInContainer = document.querySelector(".signIn");
const noEduguest = document.querySelector(".no-eduquest");
const formButton = document.querySelector(".form__btn");
const nameInput = document.querySelector(".form__input");
const spinners = document.querySelectorAll(".spinner");
const headerTitles = document.querySelectorAll(".heading__title");
const signInButton = document.querySelector(".signIn-google");
const activeCampaignContainer = document.querySelector(
  ".activeCampaign-form-container"
);
const activeCampaignForm = document.querySelector(".activeCampaign-form");
const activeCampaignButton = document.querySelector(
  ".activeCampaign-form-button"
);
const timerDays = document.querySelector("span[data-days]");
const timerHours = document.querySelector("span[data-hours]");
const timerMinutes = document.querySelector("span[data-minutes]");
const timerSeconds = document.querySelector("span[data-seconds]");

// ETC VARIABLES
let timerId = 0;
let spreadSheetId = "";
let roomNumber = 0;
let links = [];
let googleName = "";

// PARAMS
const urlParams = new URLSearchParams(window.location.search);
const signInSuccess = urlParams.get("signInSuccess");

//SHOWING INTERFACE LOGIC
const fetchSpreadSheetData = async (data) => {
  activeCampaignContainer.style.display = "none";

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
  const updatedLatestDate = new Date(eqDate.getTime() + 90 * 60 * 1000); // add 40 minutes

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
const form = document.querySelector(".form");

form.addEventListener("submit", onFormSubmit);

async function onFormSubmit(evt) {
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
      if (data[0] === true && signInSuccess === "true") {
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
          .then(({ data }) => {
            if (data) {
              window.location.href = links[Number(data) - 1];
              return;
            }
            const link = links.filter((link, index) => room === index + 1);
            window.open(links[room - 1], "_blank");
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
            hideSpinner();
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

// GOOGLE SIGN IN
signInButton.addEventListener("click", handleGoogleSignIn);

function handleGoogleSignIn() {
  const authUrl = "/signin/google";

  window.location.href = authUrl;
}

// Check if the URL contains successful sign-in and googleName
if (signInSuccess === "true" && !googleName) {
  googleName = urlParams.get("googleName");
  signInButton.style.display = "none";
  activeCampaignContainer.style.display = "block";
} else {
  activeCampaignContainer.style.display = "none";
  // fetchSpreadSheetData();
}

// ACTIVE CAMPAIGN
activeCampaignForm.addEventListener("submit", onACformSubmit);

async function onACformSubmit(evt) {
  evt.preventDefault();
  const internId = activeCampaignForm.elements.internACid.value;

  const responseDate = await fetch("/currentDateTime");
  const { currentDateTime } = await responseDate.json();
  const currentDate = new Date(currentDateTime);

  try {
    activeCampaignButton.style.display = "none";
    showSpinner();
    activeCampaignForm.reset();

    const response = await fetch("/getData");
    const { data } = await response.json();
    const eqDate = new Date(data[0][0]);
    const processedEQDate = new Date(eqDate.getTime() + 90 * 60 * 1000);
    const closestInternsList = data[0][6];

    if (processedEQDate.getTime() < currentDate.getTime()) {
      showNoUpcomingEQ();
      return;
    }

    const isInternExist = closestInternsList.find((intern) => {
      if (intern === internId) {
        fetchSpreadSheetData(data[0]);
        return intern;
      }
    });
    if (!isInternExist) {
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
      futureEQ ? fetchSpreadSheetData(futureEQ) : showNoUpcomingEQ();
    }
  } catch (error) {
    console.log(error.message);
  } finally {
    hideSpinner();
    activeCampaignButton.style.display = "inline";
  }
}

function showNoUpcomingEQ() {
  noEduguest.style.display = "block";
  activeCampaignContainer.style.display = "none";
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
