const getUserACId = () => {
  const currentUrl = window.location.href;
  const match = currentUrl.match(/\/(\w+)(?:\?.*)?$/);
  if (match) {
    return match[1];
  }
  return null;
};

export const setContactToFailedList = async () => {
  try {
    const userACId = getUserACId();
    const userResponse = await fetch(`/users/${userACId}`);
    const { name, googleName, mainRoomNumber, loginCredential } =
      await userResponse.json();

    const dataResponse = await fetch("/getData");
    const { data } = await dataResponse.json();

    const sheetName = "Main room " + mainRoomNumber;
    const spreadSheetId = data[0][1];

    await fetch("/setData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sheetName: "Tech check",
        spreadSheetId,
        data: [name, googleName, "Failed", mainRoomNumber],
      }),
    });

    fetch("/getEmailsFromEntered", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: loginCredential,
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then(async ({ data }) => {
        if (data) {
          return;
        }

        await fetch("/setData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetName: "Entered",
            spreadSheetId,
            data: [loginCredential, name, googleName, mainRoomNumber],
          }),
        });

        await fetch("/setData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetName,
            spreadSheetId,
            data: [name, googleName],
          }),
        });
      });
  } catch (error) {
    console.log(error.message);
  }
};
