const express = require("express");
const { Mutex } = require("async-mutex");
const { google } = require("googleapis");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const lock = new Mutex();
const app = express();

// Set the static files directory
const publicDir = path.join(__dirname, "public");

//  Middlewares --- USE
app.use(express.static(publicDir));
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());

// .env Variables
const clientEmailE = process.env.CLIENT_EMAIL_E;
const privateKeyE = process.env.PRIVATE_KEY_E;
const spreadsheetId = process.env.SPREADSHEET_ID;
const clientEmailM = process.env.CLIENT_EMAIL_M;
const privateKeyM = process.env.PRIVATE_KEY_M;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const baselink = process.env.BASE_LINK;
const redirectUri = process.env.REDIRECT_URI;

const authE = new google.auth.JWT({
  email: clientEmailE,
  key: privateKeyE.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const authM = new google.auth.JWT({
  email: clientEmailM,
  key: privateKeyM.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Cached Data "/getData"
let cachedData = null;

const dataArrayE = [];
const dataArrayM = [];

const requestQueueE = [];
const requestQueueM = [];

let isProcessingQueueE = false;
let isProcessingQueueM = false;

// Endpoints for Vlad to quickly restart server
app.get("/kapec", (req, res) => {
  cachedData = null;
  res.redirect(baselink);
});

app.get("/babita", (req, res) => {
  dataArrayE.length = 0;
  requestQueueE.length = 0;
  requestQueueM.length = 0;
  dataArrayM.length = 0;
  res.redirect(baselink);
});

// Get Date
app.get("/currentDateTime", (req, res) => {
  const currentDate = new Date(); // Get the current date and time on the server

  res.json({ currentDateTime: currentDate });
});

// Sign in with Google
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

app.get("/signin/google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/userinfo.profile",
    prompt: "select_account",
  });

  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const service = google.oauth2({ version: "v2", auth: oauth2Client });
    const response = await service.userinfo.get();
    const googleName = response.data.name;

    res.redirect(`${baselink}/?signInSuccess=true&googleName=${googleName}`);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred");
  }
});

// Endpoint to be sure that the eduquest has started
app.get("/isEduquestActive", (req, res) => {
  const currentDate = new Date();
  const startDate = new Date(cachedData[0][0]);
  const processStartDate = new Date(startDate.getTime() + 90 * 60 * 1000);

  if (
    currentDate.getTime() >= startDate.getTime() &&
    currentDate <= processStartDate.getTime()
  ) {
    res.json({ data: [true, baselink] });
    return;
  }
  res.json({ data: [false, baselink] });
});

// Define a route to handle the /getDate request
app.get("/getData", (req, res) => {
  const currentDate = new Date();
  if (cachedData) {
    const startDate = new Date(cachedData[0][0]);
    if (new Date(startDate.getTime() + 120 * 60 * 1000) < currentDate) {
      cachedData = null;
      dataArrayE.length = 0;
      dataArrayM.length = 0;
      requestQueueE.length = 0;
      requestQueueM.length = 0;
    }
  }
  if (cachedData) {
    console.log("using cache");
    res.json({ data: cachedData });
    return;
  }
  console.log("not using cache");
  const sheets = google.sheets({ version: "v4", auth: authE });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: "Eduquests!A:F",
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
    },
    async (err, response) => {
      if (err) {
        console.error("Error:", err);
        res.status(500).send("An error occurred");
        return;
      }

      const rows = response.data.values;
      if (rows && rows.length) {
        rows.shift();
        const closestDateArray = await getClosestDate(rows);
        const listOfInterns = await getInternsFromACbyListId(
          closestDateArray[5]
        );
        cachedData = [[...closestDateArray, listOfInterns], rows];
        res.json({ data: cachedData });
      } else {
        res.json({ message: "No data found." });
      }
    }
  );
});

async function getInternsFromACbyListId(listId) {
  let offset = 0;
  const contactsData = [];

  while (true) {
    const response = await fetch(
      `https://nobelcoaching22331.api-us1.com/api/3/contacts?listid=${listId}&limit=100&offset=${offset}&status=1`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "Api-Token":
            "f787e136dd0dd5a2d1bc6e9e10b3e13e5e26cff03f7d3d31072e71a741df259e477736c6",
        },
      }
    );

    const result = await response.json();
    const contacts = await result.contacts;

    if (contacts.length > 0) {
      contactsData.push(...contacts);
      offset += 100;
    } else {
      break;
    }
  }

  const ids = contactsData.map((data) => data.id);
  return ids;
}

async function getClosestDate(rows) {
  const currentDate = new Date();

  const closestDate = rows.reduce((closest, current) => {
    const currentRowDate = new Date(current[0]);
    const closestRowDate = new Date(closest[0]);

    const currentDiff = Math.abs(currentRowDate - currentDate);
    const closestDiff = Math.abs(closestRowDate - currentDate);

    return currentDiff < closestDiff &&
      currentRowDate.getTime() + 90 * 60 * 1000 >= currentDate
      ? current
      : closest;
  });
  return closestDate;
}

app.post("/checkInternInFutureEQ", (req, res) => {
  const internId = req.body.internId;
  const eduquestsList = cachedData[1];
  const closestEQ = cachedData[0];

  const futureEQs = eduquestsList.filter((eduquest) => {
    const eduquestDate = new Date(eduquest[0]);
    const eduquestSheetId = eduquest[1];
    const currentDate = new Date();
    if (
      eduquestDate.getTime() > currentDate.getTime() &&
      closestEQ[1] !== eduquestSheetId
    ) {
      return eduquest;
    }
  });
  if (futureEQs.length > 0) {
    futureEQs.map(async (futureEQ) => {
      const eqListId = futureEQ[5];
      const internsList = await getInternsFromACbyListId(eqListId);

      internsList.find((intern) => {
        if (intern === internId) {
          res.json({ futureEQ });
          return;
        }
      });
    });
  } else {
    res.json({ futureEQ: null });
  }
});

let roomCounter = 0;
function getNextRoomNumber(max) {
  roomCounter += 1;
  if (roomCounter > max) {
    roomCounter = 1;
  }
  return roomCounter;
}

// Example endpoint that uses the shared roomCounter.
app.post("/getNextRoomNumber", (req, res) => {
  const maxRooms = req.body.maxNumber;
  const roomNumber = getNextRoomNumber(maxRooms);
  res.json({ roomNumber });
});

app.post("/getEmailsFromEntered", (req, res) => {
  const email = req.body.data;
  let isEmailExist = false;
  let spreadsheetObj = dataArrayE[0];

  if (spreadsheetObj) {
    const enteredData = spreadsheetObj.data;
    isEmailExist = enteredData.find((data) => data[0] === email);
  }

  if (isEmailExist) {
    res.json({ data: isEmailExist[3] });
  } else {
    res.json({ data: 0 });
  }
});

app.post("/setData", async (req, res) => {
  const spreadsheetId = req.body.spreadsheetId;
  const data = req.body.data;
  const sheetName = req.body.sheetName;

  // Check if required parameters are provided
  if (!spreadsheetId || !data) {
    res.status(400).json({ error: "Missing spreadsheet ID or data" });
    return;
  }

  // Acquire the lock to ensure exclusive access to the array
  await lock.acquire();

  if (data.length === 2) requestQueueM.push({ spreadsheetId, data, sheetName });
  else requestQueueE.push({ spreadsheetId, data, sheetName });

  // Release the lock
  lock.release();

  res.sendStatus(200);
  if (data.length === 2) {
    if (!isProcessingQueueM) processQueueM();
  } else {
    if (!isProcessingQueueE) processQueueE();
  }
});

async function processQueueE() {
  isProcessingQueueE = true;

  while (requestQueueE.length > 0) {
    const { spreadsheetId, data, sheetName } = requestQueueE[0]; // Retrieve the first request from the queue
    try {
      const sheets = google.sheets({ version: "v4", auth: authE });
      // Check if the spreadsheet object exists in the array
      let spreadsheetObj = dataArrayE.find(
        (obj) => obj.spreadsheetId === spreadsheetId
      );

      // If the spreadsheet object doesn't exist, create a new one with count = 2
      if (!spreadsheetObj) {
        spreadsheetObj = {
          spreadsheetId,
          sheets: [{ sheetName, count: 2 }],
          data: [],
        };
        dataArrayE.push(spreadsheetObj);
      }

      let sheetObj = spreadsheetObj.sheets.find(
        (obj) => obj.sheetName === sheetName
      );

      spreadsheetObj.data.push(data);

      // If the sheet object doesn't exist, create a new one with count = 3
      if (!sheetObj) {
        spreadsheetObj.sheets.push({ sheetName, count: 3 });
        sheetObj = { sheetName, count: 2 };
      }

      const lastRow = sheetObj.count;

      // Set the data in the last row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${lastRow}:D${lastRow}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [data],
        },
      });

      sheetObj.count++;
      requestQueueE.shift();
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  isProcessingQueueE = false;
}
async function processQueueM() {
  isProcessingQueueM = true;

  while (requestQueueM.length > 0) {
    const { spreadsheetId, data, sheetName } = requestQueueM[0]; // Retrieve the first request from the queue
    try {
      const sheets = google.sheets({ version: "v4", auth: authM });

      // Get the last row in the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:B`,
        majorDimension: "ROWS",
      });
      const rows = response.data.values;
      const lastRow = rows.length + 1;

      // Set the data in the last row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${lastRow}:B${lastRow}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [data],
        },
      });

      requestQueueM.shift();
    } catch (error) {
      console.error(error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  isProcessingQueueM = false;
}

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
