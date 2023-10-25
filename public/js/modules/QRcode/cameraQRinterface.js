import { QRvideoInspector } from "./QRvideoInspector.js";

const cameraCheckButtonEl = document.getElementById("camera-check-btn");
const qrProcceedBtnEl = document.querySelector(".qr-button");
const qrFailureMessage = document.querySelector(".qr-failure-message");

const videoInspector = new QRvideoInspector();

cameraCheckButtonEl.addEventListener("click", () => {
  videoInspector.inspect();
});

qrProcceedBtnEl.addEventListener("click", async () => {
  const userId = getUserACId();
  const response = await fetch(`users/${userId}`);
  const user = await response.json();
  console.log(user);
  const isFieldsAreTrue = Object.values(user).every((value) => value);

  if (!isFieldsAreTrue) {
    qrFailureMessage.style.display = "block";
    return;
  }
  window.location.href = user.meetingLink;
});

function getUserACId() {
  const currentUrl = window.location.href;
  const match = currentUrl.match(/\/(\w+)(?:\?.*)?$/);
  if (match) {
    return match[1];
  }
  return null;
}
