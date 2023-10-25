import { QRmicroInspector } from "./QRmicroInspector.js";

const microCheckButtonEl = document.getElementById("micro-check-btn");
const qrProcceedBtnEl = document.querySelector(".qr-button");
const qrFailureMessage = document.querySelector(".qr-failure-message");

const microInspector = new QRmicroInspector();

microCheckButtonEl.addEventListener("click", () => {
  microInspector.inspect();
});

qrProcceedBtnEl.addEventListener("click", async () => {
  const userId = getUserACId();
  const response = await fetch(`users/${userId}`);
  const user = await response.json();

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
