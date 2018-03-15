import { settingsStorage } from "settings";
import * as messaging from "messaging";
import { sendVal, stripQuotes } from "../common/utils.js";

messaging.peerSocket.onopen = function() {
  restoreSettings();
}

settingsStorage.onchange = evt => {
  console.log("Sent key " + evt.key);
  console.log("Sent newValue " + evt.newValue);
  let data = {
    key: evt.key,
    newValue: evt.newValue
  };
  sendVal(data);
};

function restoreSettings() {
  for (let index = 0; index < settingsStorage.length; index++) {
    let key = settingsStorage.key(index);
    if (key) {
      let data = {
        key: key,
        newValue: JSON.parse(settingsStorage.getItem(key))
      };
      sendVal(data);
    }
  }
}