const express = require("express");
const { Mutex } = require("async-mutex");
const { google } = require("googleapis");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const lock = new Mutex();
const app = express();

// Set the static files directory
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

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

// Load existing data from the file or initialize an empty array
const dataArrayE = [];
const dataArrayM = [];

const requestQueueE = [];
const requestQueueM = [];

let isProcessingQueueE = false;
let isProcessingQueueM = false;

// Endpoints for Vlad to quickly restart server
app.get("/kapec", (req, res) => {
  cachedData = null;
  res.send("okay");
});

app.get("/babita", (req, res) => {
  dataArrayE.length = 0;
  requestQueueE.length = 0;
  requestQueueM.length = 0;
  dataArrayM.length = 0;
  res.send("okay");
});

// Get Date
app.get("/currentDateTime", (req, res) => {
  const currentDate = new Date(); // Get the current date and time on the server

  res.json({ currentDateTime: currentDate });
});

// Configure bodyParser to parse JSON data
app.use(bodyParser.json());

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
  const startDate = new Date(cachedData[0]);
  const processStartDate = new Date(startDate.getTime() + 90 * 60 * 1000);

  if (
    currentDate.getTime() >= startDate.getTime() &&
    currentDate <= processStartDate.getTime()
  ) {
    res.json({ data: true });
    return;
  }
  res.json({ data: baselink });
});

// Define a route to handle the /getDate request
app.get("/getData", (req, res) => {
  const currentDate = new Date();
  if (cachedData) {
    const startDate = new Date(cachedData[0]);
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
      range: "Eduquests!A:D",
      majorDimension: "ROWS",
      valueRenderOption: "UNFORMATTED_VALUE",
    },
    (err, response) => {
      if (err) {
        console.error("Error:", err);
        res.status(500).send("An error occurred");
        return;
      }

      const rows = response.data.values;
      if (rows && rows.length) {
        rows.shift();
        const closestDateArray = rows.reduce((closest, current) => {
          const currentRowDate = new Date(current[0]);
          const closestRowDate = new Date(closest[0]);

          const currentDiff = Math.abs(currentRowDate - currentDate);
          const closestDiff = Math.abs(closestRowDate - currentDate);

          return currentDiff < closestDiff ? current : closest;
        });

        cachedData = closestDateArray;
        res.json({ data: closestDateArray });
      } else {
        res.json({ message: "No data found." });
      }
    }
  );
});
app.use(express.json());

app.post("/getEmailsFromEntered", (req, res) => {
  const data = req.body.data;
  let isEmailExist = false;

  let spreadsheetObj = dataArrayE[0];

  if (spreadsheetObj) {
    const enteredEmails = spreadsheetObj.data;
    isEmailExist = enteredEmails.find((email) => email === data[0]);
  }

  if (isEmailExist) {
    res.json({ data: data[2] });
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

      spreadsheetObj.data.push(data[0]);

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
      console.error("Quota error");
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
      console.error("Quota error");
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
