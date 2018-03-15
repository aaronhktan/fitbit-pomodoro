import { me } from "appbit";
import clock from "clock";
import document from "document";
import * as fs from "fs";
import * as haptics from "haptics";
import * as messaging from "messaging";
import { sendVal, stripQuotes } from "../common/utils.js";

var backgroundRect = document.getElementById("backgroundRect");
var backgroundRectShortResting = document.getElementById("backgroundRectShortResting");
var backgroundRectLongResting = document.getElementById("backgroundRectLongResting");

var btnTRReset = document.getElementById("btn-tr-reset");
var btnTRForward = document.getElementById("btn-tr-forward");
var btnBRPlay = document.getElementById("btn-br-play");
var btnBRPause = document.getElementById("btn-br-pause");
var pomodoroText = document.getElementById("pomodoroText");
var stateText = document.getElementById("stateText");
var minuteText = document.getElementById("minuteText");
var unitText = document.getElementById("unitText");

var pomodoroNumber = 0;
var secondsToEnd = 15 * 60;
var timer, timerSet = false;
var state = "initialize"; // Possible states are initialize, working, shortResting, longResting, working-paused, shortResting-paused, and longResting-paused
var pomodoroDuration = 25, shortRestDuration = 5, longRestDuration = 15;

me.addEventListener("unload", function() {
  let json_data = {
    "state": state,
    "secondsToEnd": secondsToEnd,
    "pomodoroNumber": pomodoroNumber
  }
  fs.writeFileSync("lastState.txt", json_data, "cbor");
});

messaging.peerSocket.onmessage = function(evt) {
  if (evt.data.hasOwnProperty("key")) {
    if (evt.data.key == "pomodoro-duration") {
      if (evt.data.newValue.hasOwnProperty("values")) {
        pomodoroDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        var res = JSON.parse(evt.data.newValue);
        pomodoroDuration = JSON.stringify(res["values"][0]["value"]);
      }
      if (state == "initialize") {
        minuteText.text = pomodoroDuration;
      }
    } else if (evt.data.key == "short-rest-duration") {
      if (evt.data.newValue.hasOwnProperty("values")) {
        shortRestDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        var res = JSON.parse(evt.data.newValue);
        shortRestDuration = JSON.stringify(res["values"][0]["value"]);
      }
    } else if (evt.data.key == "long-rest-duration") {
      if (evt.data.newValue.hasOwnProperty("values")) {
        longRestDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        var res = JSON.parse(evt.data.newValue);
        longRestDuration = JSON.stringify(res["values"][0]["value"]);
      }
    }

    let json_data = {
      "pomodoroDuration": pomodoroDuration,
      "shortRestDuration": shortRestDuration,
      "longRestDuration": longRestDuration
    }
    fs.writeFileSync("settings.txt", json_data, "cbor");
  }
}

btnTRReset.onactivate = function(evt) {
  haptics.vibration.start("confirmation");
  
  if (state == "working-paused") {
    clearInterval(timer);
  } else if (state == "shortResting-paused") {
    endShortRestTimer(false);
  } else if (state == "longResting-paused") {
    endLongRestTimer(false);
  }
  
  var enable = setInterval(function() {
    if (backgroundRect.width <= 348) {
      backgroundRect.width += 25;
    } else {
      clearInterval(enable);
    }
  }, 1);
  
  state = "initialize";
  pomodoroNumber = 0;
  pomodoroText.text = "Pomodoro #1";
  stateText.text = "Start a Pomodoro";
  minuteText.text = pomodoroDuration;
  secondsToEnd = Math.floor(pomodoroDuration * 60);
  
  btnTRReset.style.display = "none";
  btnTRForward.style.display = "none";
  btnBRPlay.style.display = "inline";
  btnBRPause.style.display = "none";
  pomodoroText.style.display = "none";
  minuteText.style.display = "inline";
  unitText.style.display = "inline";
}

btnTRForward.onactivate = function(evt) {
  haptics.vibration.start("confirmation");
  
  if (state == "working") {
    endWorkTimer(true);
  } else if (state == "shortResting") {
    endShortRestTimer(true);
  } else if (state == "longResting") {
    endLongRestTimer(true);
  }
}

btnBRPlay.onactivate = function (evt) {
  haptics.vibration.start("confirmation");
  
  if (state == "initialize") {
    btnTRReset.style.display = "none";
    btnTRForward.style.display = "inline";
    btnBRPlay.style.display = "none";
    btnBRPause.style.display = "inline";
    pomodoroText.style.display = "inline";
    unitText.style.display = "none";
    
    var disable = setInterval(function() {
      if (backgroundRect.width > 0) {
        backgroundRect.width -= 25;
      } else {
        clearInterval(disable);
      }
    }, 1);
    
    stateText.text = "Get to work!";
    secondsToEnd = pomodoroDuration * 60;
    minuteText.text = pomodoroDuration + ":00";
    
    setTimeout(function() {
      state = "working";
      startWorkTimer(false);
    }, 300);
  } else if (state == "working-paused" || state == "shortResting-paused" || state == "longResting-paused") {
    if (timerSet) {
      clearInterval(timer);
      timerSet = false;
    }
    
    btnTRReset.style.display = "none";
    btnTRForward.style.display = "inline";
    btnBRPlay.style.display = "none";
    btnBRPause.style.display = "inline";
    minuteText.style.display = "inline";
    
    if (state == "working-paused") {
      stateText.text = "Get to work!";
      startWorkTimer(true);
    } else if (state == "shortResting-paused") {
      stateText.text = "Take a short break";
      startShortRestTimer();
    } else if (state == "longResting-paused") {
      stateText.text = "Take a long break";
      startLongRestTimer();
    }
  }
};

btnBRPause.onactivate = function (evt) {
  haptics.vibration.start("confirmation");
  
  if (state == "working" || state == "shortResting" || state == "longResting") {
    if (state == "working") {
      state = "working-paused";      
    } else if (state == "shortResting") {
      state = "shortResting-paused";
    } else if (state == "longResting") {
      state = "longResting-paused";
    }
    
    if (timerSet) {
      clearInterval(timer);
      timerSet = false;
    }
    
    var textIsVisible = true;
    timer = setInterval(function() {
      if (textIsVisible) {
        minuteText.style.display = "none";
        textIsVisible = false;
      } else {
        minuteText.style.display = "inline";
        textIsVisible = true;
      }
    }, 1000);
    timerSet = true;
    
    btnTRReset.style.display = "inline";
    btnTRForward.style.display = "none";
    btnBRPlay.style.display = "inline";
    btnBRPause.style.display = "none";
    
    stateText.text = "Paused...";
  }
}

function startWorkTimer(is_resume) {
  state = "working";
  if (!is_resume) {
    pomodoroNumber++;
    pomodoroText.text = `Pomodoro #${pomodoroNumber}`;
  }
  timer = setInterval(function () {
    secondsToEnd--;
    let minutes = Math.floor(secondsToEnd / 60);
    let seconds = secondsToEnd % 60;
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;
    seconds = (seconds < 10) ? ("0" + seconds) : seconds;
    minuteText.text = minutes + ":" + seconds;
    backgroundRect.width = 348 - Math.floor(348 * secondsToEnd / Math.floor(pomodoroDuration * 60));
    if (secondsToEnd < 0) {
      endWorkTimer(true);
    }
  }, 1000);
  timerSet = true;
};

function endWorkTimer(start_next) {
  clearInterval(timer);
  haptics.vibration.start("ping");

  var disable = setInterval(function() {
    if (backgroundRect.width > 0) {
      backgroundRect.width -= 25;
    } else {
      clearInterval(disable);
    }
  }, 1);

  if (start_next) {
    if (pomodoroNumber % 4 != 0) {
      stateText.text = "Take a short break";
      secondsToEnd = Math.floor(shortRestDuration * 60);
      minuteText.text = (shortRestDuration) < 10 ? (`0${shortRestDuration}:00`) : (shortRestDuration + ":00");
      startShortRestTimer();
    } else {
      stateText.text = "Take a long break";
      secondsToEnd = Math.floor(longRestDuration * 60);
      minuteText.text = (longRestDuration) < 10 ? (`0${longRestDuration}:00`) : (longRestDuration + ":00");
      startLongRestTimer();
    }
  }
}

function startShortRestTimer() {
  state = "shortResting";
  timer = setInterval(function () {
    secondsToEnd--;
    let minutes = Math.floor(secondsToEnd / 60);
    let seconds = secondsToEnd % 60;
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;
    seconds = (seconds < 10) ? ("0" + seconds) : seconds;
    minuteText.text = minutes + ":" + seconds;
    backgroundRectShortResting.width = 348 - Math.floor(348 * secondsToEnd / (shortRestDuration * 60));
    if (secondsToEnd < 0) {
      endShortRestTimer(true);
    }
  }, 1000);
  timerSet = true;
}

function endShortRestTimer(start_next) {
  clearInterval(timer);
  haptics.vibration.start("ping");

  var disable = setInterval(function() {
    if (backgroundRectShortResting.width > 0) {
      backgroundRectShortResting.width -= 25;
    } else {
      clearInterval(disable);
    }
  }, 1);

  if (start_next) {
    stateText.text = "Get to work!";
    secondsToEnd = Math.floor(pomodoroDuration * 60);
    minuteText.text = (pomodoroDuration) < 10 ? (`0${pomodoroDuration}:00`) : (pomodoroDuration + ":00");
    startWorkTimer(false);
  }
}

function startLongRestTimer() {
  state = "longResting";
  timer = setInterval(function () {
    secondsToEnd--;
    let minutes = Math.floor(secondsToEnd / 60);
    let seconds = secondsToEnd % 60;
    minutes = (minutes < 10) ? ("0" + minutes) : minutes;
    seconds = (seconds < 10) ? ("0" + seconds) : seconds;
    minuteText.text = minutes + ":" + seconds;
    backgroundRectLongResting.width = 348 - Math.floor(348 * secondsToEnd / (longRestDuration * 60));
    if (secondsToEnd < 0) {
      endLongRestTimer(true);
    }
  }, 1000);
  timerSet = true;
}

function endLongRestTimer(start_next) {
  clearInterval(timer);
  haptics.vibration.start("ping");

  var disable = setInterval(function() {
    if (backgroundRectLongResting.width > 0) {
      backgroundRectLongResting.width -= 25;
    } else {
      clearInterval(disable);
    }
  }, 1);

  if (start_next) {
    stateText.text = "Get to work!";
    secondsToEnd = Math.floor(pomodoroDuration * 60);
    minuteText.text = (pomodoroDuration - 1) < 10 ? (`0${pomodoroDuration - 1}:59`) : (pomodoroDuration - 1 + ":59");
    startWorkTimer(false);
  }
}

try {
  var settings = fs.readFileSync("settings.txt", "cbor");
  if (settings) {
    if (settings.pomodoroDuration !== undefined) {
      pomodoroDuration = settings.pomodoroDuration;
      minuteText.text = pomodoroDuration;
      secondsToEnd = Math.floor(pomodoroDuration * 60);
    }
    if (settings.shortRestDuration !== undefined) {
      shortRestDuration = settings.shortRestDuration;
    }
    if (settings.longRestDuration !== undefined) {
      longRestDuration = settings.longRestDuration;
    }
  }
} catch (e) {
  console.log("Settings not found; defaulting to presets.");
}

try {
  var lastState = fs.readFileSync("lastState.txt", "cbor");
  if (lastState) {
    if (lastState.state !== undefined) {
      state = lastState.state;
    }
    if (lastState.secondsToEnd !== undefined) {
      secondsToEnd = Math.floor(lastState.secondsToEnd);
    }
    if (lastState.pomodoroNumber !== undefined) {
      pomodoroNumber = lastState.pomodoroNumber;
    }
    
    if (state == "working" || state == "working-paused" || 
        state == "shortResting" || state == "shortResting-paused" || 
        state == "longResting" || state == "longResting-paused") {
      if (state == "working" || state == "working-paused") {
        state = "working-paused";
        backgroundRect.width = 348 - Math.floor(348 * secondsToEnd / Math.floor(pomodoroDuration * 60));
      } else if (state == "shortResting" || state == "shortResting-paused") {
        state = "shortResting-paused";
        backgroundRect.width = 0;
        backgroundRectShortResting.width = 348 - Math.floor(348 * secondsToEnd / (shortRestDuration * 60));
      } else if (state == "longResting" || state == "longResting-paused") {
        state = "longResting-paused";
        backgroundRect.width = 0;
        backgroundRectLongResting.width = 348 - Math.floor(348 * secondsToEnd / (longRestDuration * 60));
      }

      if (timerSet) {
        clearInterval(timer);
        timerSet = false;
      }

      var textIsVisible = true;
      timer = setInterval(function() {
        if (textIsVisible) {
          minuteText.style.display = "none";
          textIsVisible = false;
        } else {
          minuteText.style.display = "inline";
          textIsVisible = true;
        }
      }, 1000);
      timerSet = true;

      btnTRReset.style.display = "inline";
      btnTRForward.style.display = "none";
      btnBRPlay.style.display = "inline";
      btnBRPause.style.display = "none";

      pomodoroText.text = `Pomodoro #${pomodoroNumber}`;
      stateText.text = "Paused...";
      let minutes = Math.floor(secondsToEnd / 60);
      let seconds = secondsToEnd % 60;
      minutes = (minutes < 10) ? ("0" + minutes) : minutes;
      seconds = (seconds < 10) ? ("0" + seconds) : seconds;
      minuteText.text = minutes + ":" + seconds;
      
      pomodoroText.style.display = "inline";
      unitText.style.display = "none";
    }
  }
} catch (e) {
  console.log("Last state not found, defaulting to presets.");
}