import * as messaging from "messaging";

export function sendVal(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
}

export function stripQuotes(str) {
  return str ? str.replace(/"/g, "") : "";
}