require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");

const app = express();
app.use(cors());

// Load credentials from environment variables
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
const spreadsheetId = process.env.SPREADSHEET_ID;

// Create a new JWT client using the loaded credentials
const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Define a route to handle the /getDate request
app.get("/getDate", (req, res) => {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: spreadsheetId,
      range: "Eduquests!A2:C",
    },
    (err, response) => {
      if (err) {
        console.error("Error:", err);
        res.status(500).send("An error occurred");
        return;
      }

      const rows = response.data.values;
      if (rows.length) {
        res.json({ data: rows });
      } else {
        res.json({ message: "No data found." });
      }
    }
  );
});

app.use(express.json());
// Define a route to handle setting data in a spreadsheet
// Define a route to handle setting data in a spreadsheet
app.post("/setData", express.json(), (req, res) => {
  const spreadsheetId = req.body.spreadsheetId;
  const data = req.body.data;

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
      range: "Entered",
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
          range: `Entered!A${lastRow}:C${lastRow}`, // Use the updated row number
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
