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
const clientEmail =
  "sheet-service-account@nobel-project.iam.gserviceaccount.com";
const privateKey =
  "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCZiJb/0sPng9Ay\nM4EqLl/5c3ThysCgAqcLq5h3fFVkgydONli1ExbLx6zWg2b7LkD/ymimKpJRPGJj\n31rZsq3V2QcqISY4MJ954DblFdXwwAOMpv0U5hXRVlsgS+xI4xI4LqeFmmoGGAx0\ngOxtgSyCMIY6o+loOsDstnl1UbOd9dVAxQNR3lgVvHC9umEiTkTTwotIL8Ux3xeC\nGYgpSmucQz4KiBF5lE77IUkxorXlSRJJTox3klG3FbmwZ+Q3VjcGXAHFndSXVubX\nkRah/dqmaR3YjKmDrgCduh+0RUeD+V52QVbWBcgxIOvSkKyd7t2392XrObCOT2ML\nkdsBSvKpAgMBAAECggEAARITw3rrxMyFgiQbzXh/UNT+RqjMSRFbqtgqewLR8Z58\ngq4cVj7o1MjyqphF+pBrAZ2etzHqzUg3g2zGTGhTj/8wbpnGk3O7WPU4TManNEOS\ngsOTVjb4hfotLn95CVUUBnJE1sip3psCUzmm7GiPL+U4umX0NbbbK4tmM2w7bWmL\nrE/+JxIJ6OUxaqTbOB9AI9UhjdyvB7krSmq4UfLlqAUOciq2voANdgpzCJjDZRrV\n2kbb8y8APSqudCQNUReE4hXiB3L2xUJHEov7da4UIBQMClyV+4CtkXlo0bES7MIg\nFsWCPc8bwGHd+Ry3hynCIKNM5+2KkWMZ6QURslCEEQKBgQDG5HthRjtKeG53tgmE\n8fQfPMBRdasFq5IBxCwuSJ94Ly/Llzz+fwOEtWSA7O9meQ6WhvBprdMolhizSVzc\nu5Y9mUJ+Z0WZXEz5ZotkMzHdwp9meg1iEBQ7cNTvaSxOCh1d7S6jMmIf439k4jTN\nxa0WpmjN9O79dvWfjwvpILJUXQKBgQDFngPpJvpzmnI1nskGNs+jBcWCpiGoVFV6\nziqOuDan2VnEq8gLBDPSn2plF3CncbOBTFULzAPTVAJHe3x9CiBWowHr728TVVcL\nyg83YivjCKm4QrKfWXZwgO8bgp1kANVdlQ/kwbFZCy8NZH0fVQP+3TiVCIbrtYFe\nlk2Gq0KyvQKBgCn4sWi3r29ptrYgfiXGAWROJ6+JC0wpBqjEwyYJQU3Vd1qZUc/K\n8e0hclIarfKL/V4an8VNX1AjTJcZFjWmiG/7VaLjHDbe2YeP8j5050MK/SRdAVH+\nXqakiury4NyfGc9ma/8YdMiR86JQciAyZPJwr5E27PAkGHVRdIv/0GIpAoGAZAmR\nwT1SG6NbnXk8GkE06znIulKPRz8p5njnYkguotmMb9rl8W23LjA1E+fBx4HvdMzH\nYKluZlRosvb4FfRCWpk6J82VVRwmbHllKowv20ZPZE+fTLtlEZ6zbCG6ux0Q5cbH\nvO2wcXsP3p+4F1xaIXKragZfBoNjchZ0OHAJ26ECgYB5/ITakvn3b8iLTu/vU47e\nv7gTOkrShZjmB0KUrJJkL0tArs1axACPqsI5g1A7poV49P93ReuklT5+b10qoNcg\nitfLsGfGTlLXCb9V19Bo54IpkS0TOmdCOcZNuBX5OWqLfVoNN5gM6STXiqKft2HE\nFCHsVEKJVwLK+r9wY5W77g==\n-----END PRIVATE KEY-----\n";
const spreadsheetId = "12oLLufV9URey5NviLwjB6Rhy0qJTAMuHMnjaebJmmi4";

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
