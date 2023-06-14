const { query } = require("express");
const express = require("express");
const { google } = require("googleapis");
const path = require("path");

const app = express();

// Set the static files directory
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Load credentials from environment variables
const clientEmail = "eduquest-app-v1@appspot.gserviceaccount.com";
const privateKey =
  "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCMGNmZutOw/BpK\nsrAE+jf5AXtKeROM7kC49S5aXp17c1HfNlT7XoA89DZHlhjnQYmohtWd0Fq/faa9\nsp81cUvev1m779mIo5YDlVm4bw61SVc+U1nI9dCpc/woW+Rcx1L+Ek23qIJfztTQ\nMWOYr48YfiD1UvQeYNBpkJMstSdUHoKA/kbN405YEVBmVdgS2P5dhc8MIaGJFk6f\nKRHD7cG4X3jYsLKCm7bD4ZzADRBgwmwjIZpBfk2gTvoprUUxt6PApwHZy/C7CAHm\nAKWqN78c+URfdAO4zqmnubrgJdAyE3fxAVTmyw4QdcBuwlPWHJ1fECRTb34DZZLW\nDHnovNpfAgMBAAECggEAPn8BZzo4IC4+Pk9bBUVn/b1C9jRv28EW/0tkq6ykfQMz\nJSt0GpSMCWT559JV9qe+VH8dwSJGsUDIxrvtmOYbLdlXmuaCuJkdHSkdVpC4U3fN\nowCEv4ik1krm1Ew14YuLgsrAf6r8yeeW+O7nWqAKaict5bJlMz4GCumTNfD0A+pV\nXkbvP0C6RnSl/4Y7qY+O6S7nOQoSknOlBOa6oiOKlzg/uZdHbeFfV0G7fwEXkJtp\nToHfKX6WMboxSeLcFLf/BrrCeg3ZaoDQNNSagCWYVUyU4Mb1Z/PPLJkC25daDcic\nqisMm7mjllwWxDWMnSFbKbetIlD7hxyBtxhqozmeSQKBgQC+zVIv9uHM9RB5xBGV\nZTKCC5JH2WE7FaO63vtk7Pk/eHCP2A5WdMnCegowZBQeksZLQKOl5d4Pk/2htCL7\nXY6lOBCH0GyyfkF2o5YJ6XRxXtpIIngIJ0E9la5cwLQsoeUhScdiySZM6stqECLw\nk4FdnKXcpSRkKGN5Dkbs1UHXKQKBgQC7+ApHLsfxyISNwsyfmpcFnX2cHjOv37KX\ndWr2IM9iOZqM/aXx98XnRVOvKixvuJWRp97F/lhri0UpJ+0EmW8j6JmeVFeXGFVe\nekD37QRuHuO95u+SumCryszSDsUNRkv5qU77FHyL32tcFKLozbvnXdS2P7qKqzOw\nrgoklXR+RwKBgQCpT3MN4urNv+0F0Em2Ix2lrnT40tnn3zTx/ypfjbVDcDGaQyO9\n7laW/0qJVFVSJ/ZUEqDk9syNUEpxsnKUUZnh3JU2n2nFHiojB9h9JS9R5tSVzBht\nS8Al0OvvnISFUogLePe4HjyhZnxourb2ej4Cfp3j5JsdUYWrh1LCmB6buQKBgQCT\nz+nFMDRrHZOfJqBiod5AvCgarGVY2EBIej0yb3qlc0bluFDWhlFKHGpCRJfNAwob\nEDdO20QMzegFBTCNfVq4kiC7MPfwCWKYeOq+C9SABCpzGzcp2wZKEaAfTx4F4lG8\ncjd5mhKWq4pxTokNKTuqJU8wQc0fXqG3PiUbv6tr4QKBgCFlPmQ6ZmAPisp2sWNO\nwWDLCQM6q1Qs1beFVJvLJfH0hnOyZAMZgijnIeyycoNeFCku/3srJm5faHsSgEQZ\n58ACnGw9DW4DyszlHT2ju9z6nS9hvLeAb3olmyl6MnDof5lZbfI2+pMPIA8HeA3j\nHf/PM9MOrJhfAxHOaK97r7co\n-----END PRIVATE KEY-----\n";
const spreadsheetId = "14SMFdqfvC2jpCJLw1OXMZaZ4ifkMox7E-iMJj0O6rk0";

// Create a new JWT client using the loaded credentials
const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Define a route to handle the /getDate request
app.get("/getData", (req, res) => {
  const sheets = google.sheets({ version: "v4", auth });
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
        res.json({ data: lastRow });
      } else {
        res.json({ message: "No data found." });
      }
    }
  );
});

app.get("/getEmailsFromEntered", (req, res) => {
  const spreadsheetId = req.query.spreadsheetId;
  if (!spreadsheetId) {
    res.status(400).json({ error: "Missing spreadsheet ID" });
    return;
  }

  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: "Entered!A2:C",
    },
    (err, response) => {
      if (err) {
        console.error("Error:", err);
        res.status(500).send("An error occurred");
        return;
      }
      const rows = response.data.values;
      res.json({ data: rows || [] });
    }
  );
});

app.use(express.json());

app.post("/setData", express.json(), (req, res) => {
  const spreadsheetId = req.body.spreadsheetId;
  const data = req.body.data;
  const sheetName = req.body.sheetName;

  // Check if required parameters are provided
  if (!spreadsheetId || !data) {
    res.status(400).json({ error: "Missing spreadsheet ID or data" });
    return;
  }

  const sheets = google.sheets({ version: "v4", auth });

  // Retrieve the last row number from the spreadsheet
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: sheetName,
      majorDimension: "ROWS",
    },
    (err, response) => {
      if (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "An error occurred" });
        return;
      }
      const rows = response.data.values;
      const lastRow = rows ? rows.length + 1 : 1; // Calculate the last row number + 1
      // Set the data in the last row + 1
      sheets.spreadsheets.values.update(
        {
          spreadsheetId: spreadsheetId,
          range: `${sheetName}!A${lastRow}:C${lastRow}`, // Use the updated row number
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [data],
          },
        },
        (err, response) => {
          if (err) {
            console.error("Error:", err);
            res.status(500).json({ error: "An error occurred" });
            return;
          }
          res.json({ message: "Data set successfully" });
        }
      );
    }
  );
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
