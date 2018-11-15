import { me } from 'appbit';
import { me as device } from 'device'
import * as haptics from 'haptics';
import * as messaging from 'messaging';
import { sendVal, stripQuotes } from '../common/utils.js';

import Globals from './globals';
import Settings from './settings';
import UI from './ui';

if (!device.screen) device.screen = { width: 348, height: 250 };

// Create globals, UI, and settings objects
var globals = new Globals();
var settings = new Settings();
var ui = new UI();

me.addEventListener('unload', () => {
  globals.save();
  settings.save();
});

// Receive and parse new settings
messaging.peerSocket.onmessage = evt => {
  if (evt.data.hasOwnProperty('key')) {
    if (evt.data.key == 'pomodoro-duration') {
      if (evt.data.newValue.hasOwnProperty("values")) {
        settings.pomodoroDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        let res = JSON.parse(evt.data.newValue);
        settings.pomodoroDuration = JSON.stringify(res["values"][0]["value"]);
      }
      if (globals.state == 'initialize') {
        ui.minuteLabel.text = settings.pomodoroDuration;
      }
    } else if (evt.data.key == 'short-rest-duration') {
      if (evt.data.newValue.hasOwnProperty("values")) {
        settings.shortRestDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        let res = JSON.parse(evt.data.newValue);
        settings.shortRestDuration = JSON.stringify(res["values"][0]["value"]);
      }
    } else if (evt.data.key == 'long-rest-duration') {
      if (evt.data.newValue.hasOwnProperty("values")) {
        settings.longRestDuration = JSON.stringify(evt.data.newValue["values"][0]["value"]);
      } else {
        let res = JSON.parse(evt.data.newValue);
        settings.longRestDuration = JSON.stringify(res["values"][0]["value"]);
      }
    } else if (evt.data.key == 'continue-on-resume') {
      settings.continueOnResume = JSON.parse(evt.data.newValue);    
    }
  }

  settings.save();
}

ui.resetButton.onactivate = evt => {
  if (!globals.isAnimating) {
    haptics.vibration.start('confirmation');

    endStateTimer(false);

    setTimeout(() => {
      ui.setPomodoroRectColours(globals.state);
      let enable = setInterval(() => {
        if (ui.pomodoroRect.width <= device.screen.width) {
          globals.isAnimating = true;
          ui.pomodoroRect.width += 25;
        } else {
          globals.isAnimating = false;
          ui.pomodoroRect.width = device.screen.width;
          clearInterval(enable);
        }
      }, 1);
    }, 300);

    globals.state = 'initialize';
    globals.pomodoroNumber = 0;
    globals.secondsToEnd = Math.floor(settings.pomodoroDuration * 60);

    ui.pomodoroLabel.text = 'Pomodoro #1';
    ui.stateLabel.text = 'Start a Pomodoro';
    ui.minuteLabel.text = settings.pomodoroDuration;

    ui.setButtonsReset();
    ui.setLabelsReset();
  }
}

ui.forwardButton.onactivate = evt => {
  if (!globals.isAnimating) {
    haptics.vibration.start('confirmation');

    endStateTimer(true);
  }
}

ui.playButton.onactivate = evt => {
  if (!globals.isAnimating) {
    haptics.vibration.start('confirmation');

    if (globals.state == 'initialize') {
      globals.isAnimating = true;
      // Animate rectangle going to nothing
      let disable = setInterval(() => {
        if (ui.pomodoroRect.width > 0) {
          ui.pomodoroRect.width -= 25;
        } else {
          ui.pomodoroRect.width = 0;
          clearInterval(disable);
        }
      }, 1);

      // Delay starting timer until after animation is done
      setTimeout(() => {
        startStateTimer(false);
      }, 250);

      globals.state = 'working';
      globals.secondsToEnd = settings.pomodoroDuration * 60;

      ui.stateLabel.text = 'Get to work!';
      ui.minuteLabel.text = `${settings.pomodoroDuration}:00`;

      ui.setButtonsUnpaused();
      ui.setLabelsUnpaused();
    } else if (globals.userIsPaused()) {
      globals.unpauseState();

      // Cancel other timers before starting a new one
      if (globals.timerSet) {
        clearInterval(globals.timer);
        globals.timerSet = false;
      }
      startStateTimer(true);

      ui.setButtonsUnpaused();
      ui.setStateLabelText(globals.state);
      ui.setLabelsUnpaused();
    }
  }
};

ui.pauseButton.onactivate = evt => {
  if (!globals.isAnimating) {
    haptics.vibration.start('confirmation');

    if (!globals.userIsPaused()) {
      globals.pauseState();

      // Stop pomodoro timer so we can start blinky timer
      if (globals.timerSet) {
        clearInterval(globals.timer);
        globals.timerSet = false;
      }

      globals.timer = setInterval(() => {
        if (ui.minuteLabel.style.display == 'inline') {
          ui.minuteLabel.style.display = 'none';
        } else {
          ui.minuteLabel.style.display = 'inline';
        }
      }, 1000);
      globals.timerSet = true;

      ui.setButtonsPaused();
      ui.setStateLabelText(globals.state);
    }
  }
}

function startStateTimer(is_resume) {
  // When resuming, we do not want to increment the pomodoro number!
  if (!is_resume && (globals.state == 'working' || globals.state == 'working-paused')) {
    globals.pomodoroNumber++;
    ui.pomodoroLabel.text = `Pomodoro #${globals.pomodoroNumber}`;
  }

  let duration = settings.getCurrentDuration(globals.state);

  // Clear other timers better setting one
  clearInterval(globals.timer);
  globals.timer = setInterval(() => {
    globals.secondsToEnd--;
    ui.setMinuteLabelText(globals.secondsToEnd);
    ui.pomodoroRect.width = device.screen.width 
                            - Math.floor(device.screen.width 
                                         * globals.secondsToEnd 
                                         / Math.floor(duration * 60));
    if (globals.secondsToEnd < 0) {
      endStateTimer(true);
    }
  }, 1000);
  globals.timerSet = true;
  globals.isAnimating = false;

  ui.setPomodoroRectColours(globals.state);
};

function endStateTimer(start_next) {
  haptics.vibration.start('ping');

  // Clear all other timers, then set one for the rectangle fading away
  clearInterval(globals.timer);
  globals.isAnimating = true;
  let disable = setInterval(() => {
    if (ui.pomodoroRect.width > 0) {
      ui.pomodoroRect.width -= 25;
    } else {
      ui.pomodoroRect.width = 0;
      clearInterval(disable);
    }
  }, 1);

  // It is the responsibility of the endStateTimer to increment the state
  // if starting the next state after ending a timer
  if (start_next) {
    globals.resetSecondsToEnd(settings.pomodoroDuration,
                              settings.shortRestDuration,
                              settings.longRestDuration);
    globals.incrementState();
    let duration = settings.getCurrentDuration(globals.state);
    ui.minuteLabel.text = duration < 10
                          ? `0${duration}:00`
                          : `${duration}:00`;
    globals.secondsToEnd = duration * 60;
    ui.setStateLabelText(globals.state);
    if (globals.state == 'working' || globals.state == 'working-paused') {
      globals.pomodoroNumber++;
      ui.pomodoroLabel.text = `Pomodoro #${globals.pomodoroNumber}`;
    }
    setTimeout(() => {
      startStateTimer(true);
    }, 300)
  }
}

ui.minuteLabel.text = settings.pomodoroDuration;

if (settings.continueOnResume) {
  let difference = Math.floor((Date.now() - globals.lastTimestamp) / 1000);
  // Only resume if less than 12 hours elapsed
  if (!globals.userIsPaused() && difference < 60 * 60 * 12) {
    // let difference = settings.totalDuration * 60 + 600; // Use for testing; comment out previous line
    // console.log(`totalDuration is ${settings.totalDuration}`);

    // Calculate amount of time remaining after skipping through many whole Pomodoros,
    /// i.e. work/short rest/work/short rest/work/short rest/work/long rest sequence
    let leftoverDifference = difference % (settings.totalDuration * 60);
    switch (globals.state) {
      case 'working':
        // Fast-forward to end of 'working' state if remaining time is more than the seconds to end of working state.
        if (leftoverDifference - globals.secondsToEnd > 0) {
          leftoverDifference -= globals.secondsToEnd;
          globals.state = globals.pomodoroNumber % 4 ? 'shortResting' : 'longResting';

          do {
            // Try to advance to the next resting state
            let duration = globals.pomodoroNumber % 4 ? settings.shortRestDuration : settings.longRestDuration;
            if (leftoverDifference - duration * 60 <= 0) { // Can't subtract any more, we're done
              globals.secondsToEnd = duration * 60 - leftoverDifference;
              break;
            } else {
              leftoverDifference -= duration * 60;
              globals.state = 'working';
              globals.pomodoroNumber++;
            }

            // Try to advance through next 'working' state
            if (leftoverDifference - settings.pomodoroDuration * 60 <= 0) {
              globals.secondsToEnd = settings.pomodoroDuration * 60 - leftoverDifference;
              break;
            } else {
              leftoverDifference -= settings.pomodoroDuration * 60;
              globals.state = globals.pomodoroNumber % 4 ? 'shortResting' : 'longResting';
            }
          } while (true)

        } else {
          globals.secondsToEnd -= leftoverDifference;
        }
        break;
      case 'shortResting':
      case 'longResting':
        if (leftoverDifference - globals.secondsToEnd > 0) {
          leftoverDifference -= globals.secondsToEnd; // Fast-forward to end of 'resting' state
          globals.state = 'working';
          globals.pomodoroNumber++;

          do {
            // Try to advance through next 'working' state
            if (leftoverDifference - settings.pomodoroDuration * 60 <= 0) {
              globals.secondsToEnd = settings.pomodoroDuration * 60 - leftoverDifference;
              break;
            } else {
              leftoverDifference -= settings.pomodoroDuration;
              globals.state = 'shortResting';
            }

            // Try to advance through next 'resting' state
            let duration = globals.pomodoroNumber % 4 ? settings.shortRestDuration : settings.longRestDuration; // Set duration to fast-forward depending on pomodoroNumber
            if (leftoverDifference - duration * 60 <= 0) {
              globals.secondsToEnd = duration * 60 - leftoverDifference;
              break;
            } else {
              leftoverDifference -= duration * 60;
              globals.state = 'working';
              globals.pomodoroNumber++;
            }
          } while (true)
        } else {
          globals.secondsToEnd -= leftoverDifference;
        }
        break;
      default:
        console.log(`State is invalid: ${globals.state}`);
        break;
    }
    startStateTimer(true);
    // Get number of sets that have passed by
    let elapsedPomodoros = Math.floor(difference / (settings.totalDuration * 60));

    globals.pomodoroNumber += 4 * elapsedPomodoros;

    ui.setButtonsUnpaused();
  } else {
    // More than twelve hours have elapsed, user probably forgot about their timer.
    // Set it to paused in order to allow them to resume it.
    if (globals.state != 'initialize') {

      globals.pauseState();

      if (globals.timerSet) {
        clearInterval(globals.timer);
        globals.timerSet = false;
      }

      globals.timer = setInterval(() => {
        if (ui.minuteLabel.style.display == 'inline') {
          ui.minuteLabel.style.display = 'none';
        } else {
          ui.minuteLabel.style.display = 'inline';
        }
      }, 1000);
      globals.timerSet = true;

      ui.setButtonsPaused();
    }
  }
  if (globals.state != 'initialize') {
    ui.setPomodoroRectColours(globals.state);
    ui.pomodoroLabel.text = `Pomodoro #${globals.pomodoroNumber}`;
    ui.setMinuteLabelText(globals.secondsToEnd);
    ui.setStateLabelText(globals.state);
    ui.setLabelsUnpaused(); 
  }
} else {
  if (globals.state == 'working' || globals.state == 'working-paused' || 
      globals.state == 'shortResting' || globals.state == 'shortResting-paused' || 
      globals.state == 'longResting' || globals.state == 'longResting-paused') {

    globals.pauseState();

    if (globals.timerSet) {
      clearInterval(globals.timer);
      globals.timerSet = false;
    }

    globals.timer = setInterval(() => {
      if (ui.minuteLabel.style.display == 'inline') {
        ui.minuteLabel.style.display = 'none';
      } else {
        ui.minuteLabel.style.display = 'inline';
      }
    }, 1000);
    globals.timerSet = true;

    ui.setPomodoroRectColours(globals.state);
    
    ui.setButtonsPaused();

    ui.pomodoroLabel.text = `Pomodoro #${globals.pomodoroNumber}`;
    ui.setStateLabelText(globals.state);
    ui.setMinuteLabelText(globals.secondsToEnd);
    ui.setLabelsUnpaused();
  }
}

if (globals.state != 'initialize') {
  ui.pomodoroRect.width = device.screen.width
                          - Math.floor(device.screen.width
                                       * globals.secondsToEnd
                                       / Math.floor(settings.getCurrentDuration(globals.state)
                                                    * 60));
}