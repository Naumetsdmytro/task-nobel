// require("dotenv").config(); // Load environment variables from .env file

// const { google } = require("googleapis");

// // Load credentials from environment variables
// const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
// const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
// const spreadsheetId = process.env.SPREADSHEET_ID;

// // Create a new JWT client using the loaded credentials
// const auth = new google.auth.JWT({
//   email: clientEmail,
//   key: privateKey,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// // Make API requests using the auth client
// // For example, you can use the auth client to read data from a spreadsheet
// const sheets = google.sheets({ version: "v4", auth });
// sheets.spreadsheets.values.get(
//   {
//     spreadsheetId: spreadsheetId,
//     range: "Eduquests",
//   },
//   (err, res) => {
//     if (err) {
//       console.error("Error:", err);
//       return;
//     }
//     const rows = res.data.values;
//     if (rows.length) {
//       console.log("Data:");
//       rows.forEach((row) => {
//         console.log(row);
//       });
//     } else {
//       console.log("No data found.");
//     }
//   }
// );
