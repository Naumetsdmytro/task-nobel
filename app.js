const express = require("express");
const { Mutex } = require("async-mutex");
const { google } = require("googleapis");
const path = require("path");
const lock = new Mutex();
const app = express();
const bodyParser = require("body-parser");

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

// Load credentials from environment variables
const clientEmailE = "eduquest-app-v1@appspot.gserviceaccount.com";
const privateKeyE =
  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCMGNmZutOw/BpK\nsrAE+jf5AXtKeROM7kC49S5aXp17c1HfNlT7XoA89DZHlhjnQYmohtWd0Fq/faa9\nsp81cUvev1m779mIo5YDlVm4bw61SVc+U1nI9dCpc/woW+Rcx1L+Ek23qIJfztTQ\nMWOYr48YfiD1UvQeYNBpkJMstSdUHoKA/kbN405YEVBmVdgS2P5dhc8MIaGJFk6f\nKRHD7cG4X3jYsLKCm7bD4ZzADRBgwmwjIZpBfk2gTvoprUUxt6PApwHZy/C7CAHm\nAKWqN78c+URfdAO4zqmnubrgJdAyE3fxAVTmyw4QdcBuwlPWHJ1fECRTb34DZZLW\nDHnovNpfAgMBAAECggEAPn8BZzo4IC4+Pk9bBUVn/b1C9jRv28EW/0tkq6ykfQMz\nJSt0GpSMCWT559JV9qe+VH8dwSJGsUDIxrvtmOYbLdlXmuaCuJkdHSkdVpC4U3fN\nowCEv4ik1krm1Ew14YuLgsrAf6r8yeeW+O7nWqAKaict5bJlMz4GCumTNfD0A+pV\nXkbvP0C6RnSl/4Y7qY+O6S7nOQoSknOlBOa6oiOKlzg/uZdHbeFfV0G7fwEXkJtp\nToHfKX6WMboxSeLcFLf/BrrCeg3ZaoDQNNSagCWYVUyU4Mb1Z/PPLJkC25daDcic\nqisMm7mjllwWxDWMnSFbKbetIlD7hxyBtxhqozmeSQKBgQC+zVIv9uHM9RB5xBGV\nZTKCC5JH2WE7FaO63vtk7Pk/eHCP2A5WdMnCegowZBQeksZLQKOl5d4Pk/2htCL7\nXY6lOBCH0GyyfkF2o5YJ6XRxXtpIIngIJ0E9la5cwLQsoeUhScdiySZM6stqECLw\nk4FdnKXcpSRkKGN5Dkbs1UHXKQKBgQC7+ApHLsfxyISNwsyfmpcFnX2cHjOv37KX\ndWr2IM9iOZqM/aXx98XnRVOvKixvuJWRp97F/lhri0UpJ+0EmW8j6JmeVFeXGFVe\nekD37QRuHuO95u+SumCryszSDsUNRkv5qU77FHyL32tcFKLozbvnXdS2P7qKqzOw\nrgoklXR+RwKBgQCpT3MN4urNv+0F0Em2Ix2lrnT40tnn3zTx/ypfjbVDcDGaQyO9\n7laW/0qJVFVSJ/ZUEqDk9syNUEpxsnKUUZnh3JU2n2nFHiojB9h9JS9R5tSVzBht\nS8Al0OvvnISFUogLePe4HjyhZnxourb2ej4Cfp3j5JsdUYWrh1LCmB6buQKBgQCT\nz+nFMDRrHZOfJqBiod5AvCgarGVY2EBIej0yb3qlc0bluFDWhlFKHGpCRJfNAwob\nEDdO20QMzegFBTCNfVq4kiC7MPfwCWKYeOq+C9SABCpzGzcp2wZKEaAfTx4F4lG8\ncjd5mhKWq4pxTokNKTuqJU8wQc0fXqG3PiUbv6tr4QKBgCFlPmQ6ZmAPisp2sWNO\nwWDLCQM6q1Qs1beFVJvLJfH0hnOyZAMZgijnIeyycoNeFCku/3srJm5faHsSgEQZ\n58ACnGw9DW4DyszlHT2ju9z6nS9hvLeAb3olmyl6MnDof5lZbfI2+pMPIA8HeA3j\nHf/PM9MOrJhfAxHOaK97r7co\n-----END PRIVATE KEY-----\n";
const spreadsheetId = "1D0mmQRkO27Jr2nSkkj7EyhFL6WIqd30Zvu9lcWH13ow"; //real
//const spreadsheetId = "1D0mmQRkO27Jr2nSkkj7EyhFL6WIqd30Zvu9lcWH13ow"; //test this one is test
// Create a new JWT client using the loaded credentials
const authE = new google.auth.JWT({
  email: clientEmailE,
  key: privateKeyE,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const clientEmailM =
  "eduquest-app-v1-2@eduquest-app-v1.iam.gserviceaccount.com";
const privateKeyM =
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWlmFS4pyzj4k8\nvk7bDLCTGm60YoI2e5Lb0fTq0ym8bD2pikBsU9AJ/AfO3sJ3mntnxsIhPhLnmRlM\nLoJZg8kYq6IIuEl4g9pMXDNhBVAb9+1ciy20pmS/oCN+HdMZI58qSilcUdC/aSSq\npJ/L78jfTUmgEnnL0T8Zo5F/UDBDMP5nFbv6+GH6Ef+zkYR/I8R/SWLP4lVnZ2aa\nJXRjqKZwjAHrFFovi6MKptCb9LuV11VqldAq10iVKI1gjZ/6ZvfH1FON7W+Q/mWZ\nGqzRQAMdFTUC9CAX6W4ApIk6fodpRlVowcB0X+uvGwwZfa/d/ry+CCw+he3gCQK+\nXNRJ7d1pAgMBAAECggEAOG53X1fD0HhwPf61T1pUi3Pi259025T4hn8KULu8Truj\nafcAyHeqJSu5A1mwN6EBMPUnh8yaygayF73wJDqCMEgVaz4gblS/CFGfAXM7v5dr\n8HvJr4KRi8wnsNndY3TZb0Ames3ANBLjZj1WEtcziBcPCbkSwoISKvoEitjSlULi\nRg1hDLmLurX2iGRIY1zdOFTyYgDIdH3SEKLPPhj+8zIj6ZEk3Un00CLpvJFhWMpT\naKPcB0Ja7RefGDwh7NHhS8zOLW8oWxsfhpVwjXzun0AA0JI54Sk1yumBcqhirjKy\nkFB8lensRD2AJjfADsWgw26I7SW5JWUZWZwrYpl9HwKBgQDJiuyQrCpoWAK0vdl3\n0SWiTCBvNrXBF3OaaczZlWDIc+dvDUv/EUsAcnvRGdd4HMG+xAiJdZNvJyAxHRHT\nIECVUPL/Kv2mEImne0x/wKQcvL7tXaZAQ6UpvvKtIFYA50ruYgdK5L+7tSuwZBTh\nXz6hKv7b9dbE06k/aXyslmsmcwKBgQC/RsnBTaQv6Al5T2f01YGV59uQZEG1Y5Jv\nTdSsdDprjHZio5uKQ94+vsJch3yKvjZXv9Tn51IYt7eQi4ToqGOvW5200t93QZ3/\nhdQlujUXFDjdFXUKsUStyNb1hMH1T3hhJFoVQ1cNl5cTfxUSCPdeT65GWShCacB9\n+GWKo8xZswKBgHt8loPyKS2ztzy9EjD6wd9WW40o7WY5E0jqSGyMvTc05PnDIOxQ\n0S6d9sVg2weqPv++pyhqFQLG60+May58FXYnmivEUJPekClBP9cK1sMQ1r8jYUkA\n6YLRj2mKZYe6L8wt3iACVoQRdopmV/Da5cnkSTHGyGfi9FF5Nb2dkFuHAoGBAJpT\ntgL17uwMLmCnVbvv6+8UNE3q5i1A2mxdgqNl36DYosfxM1S6b312kgDv++dBkzz3\ndQNq2w1AZaYFO8Yv3sYkiDjWDyD8W0tIIiQSejVVxo9yeY2X+06wBefwJkITzY+r\nMdeIDpvT3DwJw+laPKPmbDksRFRZWMsKeHsEr6MLAoGALLt1ccMlCs9tC/eKOoMQ\naMbTDlEwlCx0oEGHyWiIkrUEAbfCUbJnzbA4oZX+tBIpAVg9oCZmGQZnhjAICHa+\nlUspBikx2tUhragQc4+RFnG6S/ZKPMWiF/PvGZ252ZofW7d8ZT5vVP21ygsoUJfj\nBOWPGdjN0aeiVWhDiS/4fMc=\n-----END PRIVATE KEY-----\n";
const authM = new google.auth.JWT({
  email: clientEmailM,
  key: privateKeyM,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// For sign in with Google
const clientId =
  "794869557223-0ls09vm1bhcpdphicd9rrpbpedhqadhd.apps.googleusercontent.com";
const clientSecret = "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";
const baselink = "http://localhost:3000";
//const baselink = "https://test-dot-eduquest-app-v1.uw.r.appspot.com"
const redirectUri = baselink + "/oauth2callback";

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
  res.send("okay");
});

app.get("/babita", (req, res) => {
  dataArrayE = [];
  dataArrayM = [];
  res.send("okay");
});

// Get Date
app.get("/currentDateTime", (req, res) => {
  const currentDate = new Date(); // Get the current date and time on the server

  // Send the current date and time as the response
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

// Define a route to handle the /getDate request
app.get("/getData", (req, res) => {
  const currentDate = new Date();
  if (cachedData) {
    const startDate = new Date(cachedData[0]);
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

  // Push the data to the array

  if (data.length === 2) requestQueueM.push({ spreadsheetId, data, sheetName });
  else requestQueueE.push({ spreadsheetId, data, sheetName });

  // Release the lock
  lock.release();

  // Send a response to acknowledge receipt of the request
  res.sendStatus(200);
  if (data.length === 2) {
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
      console.error(error, "Quota error");
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
      console.error(error, "Quota error");
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
