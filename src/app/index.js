import { me } from 'appbit';
import { me as device } from 'device'
import * as haptics from 'haptics';
import * as messaging from 'messaging';

import Globals from './globals';
import Utils from './utils';
import Settings from './settings';
import UI from './ui';

if (!device.screen) device.screen = { width: 348, height: 250 };

// Create globals, UI, utils, and settings objects
var globals = new Globals();
var settings = new Settings();
var utils = new Utils();
var ui = new UI();

me.addEventListener('unload', () => {
  globals.save();
  settings.save();
});

// Disable app timeout on SDK 2.2 onwards
if (me.appTimeoutEnabled) {
  me.appTimeoutEnabled = false;
}

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

    utils.reinit(globals, settings, ui);
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

      ui.setStateLabelText(globals.state);
      ui.setMinuteLabelText(globals.secondsToEnd);

      ui.setButtonsUnpaused();
      ui.setLabelsStarted();
    } else if (globals.userIsPaused()) {
      globals.unpauseState();

      // Cancel other timers before starting a new one
      if (globals.timerSet) {
        clearInterval(globals.timer);
        globals.timerSet = false;
      }
      startStateTimer(true);

      ui.setStateLabelText(globals.state);

      ui.setButtonsUnpaused();
      ui.setLabelsStarted();
    }
  }
};

ui.pauseButton.onactivate = evt => {
  if (globals.isAnimating || globals.userIsPaused()) {
    return;
  }

  haptics.vibration.start('confirmation');
  utils.pause(globals, ui);
}


// startStateTimer begins animating the rectangle increasing in size every second.
// It also sets up global variables (such as pomodoroNumber, timer, etc.)
// to show that this timer is running.
// When is_resume is true, it will not increase the pomodoroNumber.
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

// endStateTimer animates the rectangle decreasing in size.
// if start_next is true, it will also set up the global variables
// to get ready for the next timer state.
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
    globals.secondsToEnd = duration * 60;
    ui.setStateLabelText(globals.state);
    ui.setMinuteLabelText(globals.secondsToEnd);
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

// Restore state
if (settings.continueOnResume) {
  let difference = Math.floor((Date.now() - globals.lastTimestamp) / 1000);
  // let difference = settings.totalDuration * 60 + 43.5 * 60; // Use for testing; comment out previous line
  // console.log(`totalDuration is ${settings.totalDuration}`);

  // Only resume if less than 12 hours elapsed
  if (!globals.userIsPaused() && difference < 60 * 60 * 12) {
    // Calculate amount of time remaining after skipping through many whole Pomodoros,
    /// i.e. work/short rest/work/short rest/work/short rest/work/long rest sequence
    let leftoverDifference = difference % (settings.totalDuration * 60);

    utils.calculateNewState(globals, settings, leftoverDifference);
    startStateTimer(true);

    // Get number of sets that have passed by
    let elapsedPomodoros = Math.floor(difference / (settings.totalDuration * 60));
    globals.pomodoroNumber += 4 * elapsedPomodoros;

    ui.setButtonsUnpaused();
  } else if (globals.userIsPaused() && difference < 60 * 60 * 12) {
    // Fewer than twelve hours have elapsed and user is paused.
    if (globals.state != 'initialize') {
      utils.pause(globals, ui);
    }
  } else {
    // More than twelve hours have elapsed, user probably forgot about their timer.
    // Reset to default so they can start a new one.
    if (globals.state != 'initialize') {
      if (globals.timerSet) {
        clearInterval(globals.timer);
        globals.timerSet = false;
      }

      utils.reinit(globals, settings, ui);
    }
  }
} else {
  if (globals.state != 'initialize') {
    utils.pause(globals, ui);
  }
}

// Restore UI
if (globals.state != 'initialize') {
  ui.setPomodoroRectColours(globals.state);
  ui.pomodoroLabel.text = `Pomodoro #${globals.pomodoroNumber}`;
  ui.setMinuteLabelText(globals.secondsToEnd);
  ui.setStateLabelText(globals.state);
  ui.setLabelsStarted();
  ui.pomodoroRect.width = device.screen.width
                          - Math.floor(device.screen.width
                                       * globals.secondsToEnd
                                       / Math.floor(settings.getCurrentDuration(globals.state)
                                                    * 60));
}
