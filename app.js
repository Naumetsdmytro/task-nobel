const { query } = require("express");
const express = require("express");
const { Mutex } = require("async-mutex");
const { google } = require("googleapis");
const path = require("path");
const lock = new Mutex(); // Mutex lock
const app = express();
const bodyParser = require("body-parser");
const { OAuth2Client } = require("google-auth-library");

// Set the static files directory
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Load credentials from environment variables
const clientEmailE = "eduquest-app-v1@appspot.gserviceaccount.com";
const privateKeyE =
  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCMGNmZutOw/BpK\nsrAE+jf5AXtKeROM7kC49S5aXp17c1HfNlT7XoA89DZHlhjnQYmohtWd0Fq/faa9\nsp81cUvev1m779mIo5YDlVm4bw61SVc+U1nI9dCpc/woW+Rcx1L+Ek23qIJfztTQ\nMWOYr48YfiD1UvQeYNBpkJMstSdUHoKA/kbN405YEVBmVdgS2P5dhc8MIaGJFk6f\nKRHD7cG4X3jYsLKCm7bD4ZzADRBgwmwjIZpBfk2gTvoprUUxt6PApwHZy/C7CAHm\nAKWqN78c+URfdAO4zqmnubrgJdAyE3fxAVTmyw4QdcBuwlPWHJ1fECRTb34DZZLW\nDHnovNpfAgMBAAECggEAPn8BZzo4IC4+Pk9bBUVn/b1C9jRv28EW/0tkq6ykfQMz\nJSt0GpSMCWT559JV9qe+VH8dwSJGsUDIxrvtmOYbLdlXmuaCuJkdHSkdVpC4U3fN\nowCEv4ik1krm1Ew14YuLgsrAf6r8yeeW+O7nWqAKaict5bJlMz4GCumTNfD0A+pV\nXkbvP0C6RnSl/4Y7qY+O6S7nOQoSknOlBOa6oiOKlzg/uZdHbeFfV0G7fwEXkJtp\nToHfKX6WMboxSeLcFLf/BrrCeg3ZaoDQNNSagCWYVUyU4Mb1Z/PPLJkC25daDcic\nqisMm7mjllwWxDWMnSFbKbetIlD7hxyBtxhqozmeSQKBgQC+zVIv9uHM9RB5xBGV\nZTKCC5JH2WE7FaO63vtk7Pk/eHCP2A5WdMnCegowZBQeksZLQKOl5d4Pk/2htCL7\nXY6lOBCH0GyyfkF2o5YJ6XRxXtpIIngIJ0E9la5cwLQsoeUhScdiySZM6stqECLw\nk4FdnKXcpSRkKGN5Dkbs1UHXKQKBgQC7+ApHLsfxyISNwsyfmpcFnX2cHjOv37KX\ndWr2IM9iOZqM/aXx98XnRVOvKixvuJWRp97F/lhri0UpJ+0EmW8j6JmeVFeXGFVe\nekD37QRuHuO95u+SumCryszSDsUNRkv5qU77FHyL32tcFKLozbvnXdS2P7qKqzOw\nrgoklXR+RwKBgQCpT3MN4urNv+0F0Em2Ix2lrnT40tnn3zTx/ypfjbVDcDGaQyO9\n7laW/0qJVFVSJ/ZUEqDk9syNUEpxsnKUUZnh3JU2n2nFHiojB9h9JS9R5tSVzBht\nS8Al0OvvnISFUogLePe4HjyhZnxourb2ej4Cfp3j5JsdUYWrh1LCmB6buQKBgQCT\nz+nFMDRrHZOfJqBiod5AvCgarGVY2EBIej0yb3qlc0bluFDWhlFKHGpCRJfNAwob\nEDdO20QMzegFBTCNfVq4kiC7MPfwCWKYeOq+C9SABCpzGzcp2wZKEaAfTx4F4lG8\ncjd5mhKWq4pxTokNKTuqJU8wQc0fXqG3PiUbv6tr4QKBgCFlPmQ6ZmAPisp2sWNO\nwWDLCQM6q1Qs1beFVJvLJfH0hnOyZAMZgijnIeyycoNeFCku/3srJm5faHsSgEQZ\n58ACnGw9DW4DyszlHT2ju9z6nS9hvLeAb3olmyl6MnDof5lZbfI2+pMPIA8HeA3j\nHf/PM9MOrJhfAxHOaK97r7co\n-----END PRIVATE KEY-----\n";
//const spreadsheetId = "12oLLufV9URey5NviLwjB6Rhy0qJTAMuHMnjaebJmmi4"; //real
const spreadsheetId = "1D0mmQRkO27Jr2nSkkj7EyhFL6WIqd30Zvu9lcWH13ow"; //test this one is test
// Create a new JWT client using the loaded credentials
const authE = new google.auth.JWT({
  email: clientEmailE,
  key: privateKeyE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const clientEmailM =
  "eduquest-app-v1-2@eduquest-app-v1.iam.gserviceaccount.com";
const privateKeyM =
  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCMGNmZutOw/BpK\nsrAE+jf5AXtKeROM7kC49S5aXp17c1HfNlT7XoA89DZHlhjnQYmohtWd0Fq/faa9\nsp81cUvev1m779mIo5YDlVm4bw61SVc+U1nI9dCpc/woW+Rcx1L+Ek23qIJfztTQ\nMWOYr48YfiD1UvQeYNBpkJMstSdUHoKA/kbN405YEVBmVdgS2P5dhc8MIaGJFk6f\nKRHD7cG4X3jYsLKCm7bD4ZzADRBgwmwjIZpBfk2gTvoprUUxt6PApwHZy/C7CAHm\nAKWqN78c+URfdAO4zqmnubrgJdAyE3fxAVTmyw4QdcBuwlPWHJ1fECRTb34DZZLW\nDHnovNpfAgMBAAECggEAPn8BZzo4IC4+Pk9bBUVn/b1C9jRv28EW/0tkq6ykfQMz\nJSt0GpSMCWT559JV9qe+VH8dwSJGsUDIxrvtmOYbLdlXmuaCuJkdHSkdVpC4U3fN\nowCEv4ik1krm1Ew14YuLgsrAf6r8yeeW+O7nWqAKaict5bJlMz4GCumTNfD0A+pV\nXkbvP0C6RnSl/4Y7qY+O6S7nOQoSknOlBOa6oiOKlzg/uZdHbeFfV0G7fwEXkJtp\nToHfKX6WMboxSeLcFLf/BrrCeg3ZaoDQNNSagCWYVUyU4Mb1Z/PPLJkC25daDcic\nqisMm7mjllwWxDWMnSFbKbetIlD7hxyBtxhqozmeSQKBgQC+zVIv9uHM9RB5xBGV\nZTKCC5JH2WE7FaO63vtk7Pk/eHCP2A5WdMnCegowZBQeksZLQKOl5d4Pk/2htCL7\nXY6lOBCH0GyyfkF2o5YJ6XRxXtpIIngIJ0E9la5cwLQsoeUhScdiySZM6stqECLw\nk4FdnKXcpSRkKGN5Dkbs1UHXKQKBgQC7+ApHLsfxyISNwsyfmpcFnX2cHjOv37KX\ndWr2IM9iOZqM/aXx98XnRVOvKixvuJWRp97F/lhri0UpJ+0EmW8j6JmeVFeXGFVe\nekD37QRuHuO95u+SumCryszSDsUNRkv5qU77FHyL32tcFKLozbvnXdS2P7qKqzOw\nrgoklXR+RwKBgQCpT3MN4urNv+0F0Em2Ix2lrnT40tnn3zTx/ypfjbVDcDGaQyO9\n7laW/0qJVFVSJ/ZUEqDk9syNUEpxsnKUUZnh3JU2n2nFHiojB9h9JS9R5tSVzBht\nS8Al0OvvnISFUogLePe4HjyhZnxourb2ej4Cfp3j5JsdUYWrh1LCmB6buQKBgQCT\nz+nFMDRrHZOfJqBiod5AvCgarGVY2EBIej0yb3qlc0bluFDWhlFKHGpCRJfNAwob\nEDdO20QMzegFBTCNfVq4kiC7MPfwCWKYeOq+C9SABCpzGzcp2wZKEaAfTx4F4lG8\ncjd5mhKWq4pxTokNKTuqJU8wQc0fXqG3PiUbv6tr4QKBgCFlPmQ6ZmAPisp2sWNO\nwWDLCQM6q1Qs1beFVJvLJfH0hnOyZAMZgijnIeyycoNeFCku/3srJm5faHsSgEQZ\n58ACnGw9DW4DyszlHT2ju9z6nS9hvLeAb3olmyl6MnDof5lZbfI2+pMPIA8HeA3j\nHf/PM9MOrJhfAxHOaK97r7co\n-----END PRIVATE KEY-----\n";
const authM = new google.auth.JWT({
  email: clientEmailM,
  key: privateKeyM,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Cached Data "/getData"
let cachedData = null;

// Load existing data from the file or initialize an empty array
let dataArrayE = [];
let dataArrayM = [];
const requestQueueE = [];
const requestQueueM = [];
let isProcessingQueueE = false;
let isProcessingQueueM = false;

// Endpoints for Vlad to quickly restart server
app.get("/kapec", (req, res) => {
  cachedData = null;
  // Send the current date and time as the response
  res.send("ok");
});

app.get("/babita", (req, res) => {
  dataArrayE = [];
  dataArrayM = [];
  res.send("ok");
});

// Get Date
app.get("/currentDateTime", (req, res) => {
  const currentDate = new Date(); // Get the current date and time on the server

  // Send the current date and time as the response
  res.json({ currentDateTime: currentDate });
});

// Configure bodyParser to parse JSON data
app.use(bodyParser.json());

// Create a new JWT client using the service account credentials
const keyPath = "./credentialss.json";
const credentials = require(keyPath);
const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/userinfo.profile"]
);

// Retrieve the user's Google name
async function getUserGoogleName() {
  const service = google.people({ version: "v1", auth: jwtClient });
  const response = await service.people.get({
    resourceName: "people/me",
    personFields: "names",
  });
  const googleName = response.data.names[0].displayName;
  return googleName;
}

// Define the route for Google sign-in
app.get("/signin/google", async (req, res) => {
  try {
    // Retrieve the user's Google name
    const googleName = await getUserGoogleName();

    // Do whatever you want with the Google name (e.g., store it, send it back as a response, etc.)

    // Return a response indicating success or any other desired result
    res.json({ name: googleName });
  } catch (error) {
    // Handle any errors that occurred during the process
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Define a route to handle the /getDate request
app.get("/getData", (req, res) => {
  if (cachedData) {
    const startDate = new Date(cachedData[0]);
    const currentDate = new Date();
    if (new Date(startDate.getTime() + 120 * 60 * 1000) < currentDate) {
      cachedData = null;
      dataArrayE = [];
      dataArrayM = [];
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
        const lastRow = rows[rows.length - 1];
        cachedData = lastRow; // Cache the retrieved data
        res.json({ data: lastRow });
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

// Define the file path for storing the array of objects

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

  // Push the data to the array

  if (data.length === 1) requestQueueM.push({ spreadsheetId, data, sheetName });
  else requestQueueE.push({ spreadsheetId, data, sheetName });

  // Release the lock
  lock.release();

  // Send a response to acknowledge receipt of the request
  res.sendStatus(200);
  if (data.length === 1) {
    if (!isProcessingQueueM) processQueueM();
  } else {
    if (!isProcessingQueueE) processQueueE();
  }
});

async function processQueueE() {
  isProcessingQueueE = true; // Set the processing flag

  while (requestQueueE.length > 0) {
    const { spreadsheetId, data, sheetName } = requestQueueE[0]; // Retrieve the first request from the queue
    try {
      const sheets = google.sheets({ version: "v4", auth: authE });
      // Check if the spreadsheet object exists in the array
      let spreadsheetObj = dataArrayE.find(
        (obj) => obj.spreadsheetId === spreadsheetId
      );

      // If the spreadsheet object doesn't exist, create a new one with count = 1
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

      // If the sheet object doesn't exist, create a new one with count = 1
      if (!sheetObj) {
        spreadsheetObj.sheets.push({ sheetName, count: 3 });
        sheetObj = { sheetName, count: 2 };
      }

      const lastRow = sheetObj.count;

      // Set the data in the appropriate row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${lastRow}:C${lastRow}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [data],
        },
      });

      // Increment the count
      sheetObj.count++;
      requestQueueE.shift();
    } catch (error) {
      console.error("Quota error");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  isProcessingQueueE = false; // Reset the processing flag
}
async function processQueueM() {
  isProcessingQueueM = true; // Set the processing flag

  while (requestQueueM.length > 0) {
    const { spreadsheetId, data, sheetName } = requestQueueM[0]; // Retrieve the first request from the queue
    try {
      const sheets = google.sheets({ version: "v4", auth: authM });
      // Check if the spreadsheet object exists in the array
      let spreadsheetObj = dataArrayM.find(
        (obj) => obj.spreadsheetId === spreadsheetId
      );

      // If the spreadsheet object doesn't exist, create a new one with count = 1
      if (!spreadsheetObj) {
        spreadsheetObj = {
          spreadsheetId,
          sheets: [{ sheetName, count: 2 }],
        };
        dataArrayM.push(spreadsheetObj);
      }

      let sheetObj = spreadsheetObj.sheets.find(
        (obj) => obj.sheetName === sheetName
      );

      // If the sheet object doesn't exist, create a new one with count = 1
      if (!sheetObj) {
        spreadsheetObj.sheets.push({ sheetName, count: 3 });
        sheetObj = { sheetName, count: 2 };
      }

      const lastRow = sheetObj.count;

      // Set the data in the appropriate row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A${lastRow}:C${lastRow}`,
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [data],
        },
      });

      // Increment the count
      sheetObj.count++;
      requestQueueM.shift();
    } catch (error) {
      console.error("Quota error");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  isProcessingQueueM = false; // Reset the processing flag
}
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
