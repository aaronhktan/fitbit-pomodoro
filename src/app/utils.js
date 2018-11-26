export default class Utils {
  constructor() {
  }

  pause(globals, ui) {
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
  }

  reinit(globals, settings, ui) {
    globals.state = 'initialize';
    globals.pomodoroNumber = 0;
    globals.secondsToEnd = Math.floor(settings.pomodoroDuration * 60);

    ui.pomodoroLabel.text = 'Pomodoro #1';
    ui.stateLabel.text = 'Start a Pomodoro';
    ui.minuteLabel.text = settings.pomodoroDuration;

    ui.setButtonsReset();
    ui.setLabelsReset();
  }

  calculateNewState(globals, settings, timeDifference) {
    // Fast-forward to end of state if time difference is more than the seconds to end of state.
    if (timeDifference - globals.secondsToEnd > 0) {
      timeDifference -= globals.secondsToEnd;
      switch (globals.state) {
        case 'working':
          globals.state = globals.pomodoroNumber % 4 ? 'shortResting' : 'longResting';
          break;
        case 'shortResting':
        case 'longResting':
          globals.state = 'working';
          globals.pomodoroNumber++;
          break;
      }

      do {
        // Try to advance to the next state
        console.log(`globals.state=${globals.state}`);
        let duration = (globals.state == 'working') ? settings.pomodoroDuration
                                                    : (globals.pomodoroNumber % 4
                                                       ? settings.shortRestDuration
                                                       : settings.longRestDuration)
        if (timeDifference - duration * 60 <= 0) { // Can't subtract any more, we're done
          globals.secondsToEnd = duration * 60 - timeDifference;
          break;
        } else {
          timeDifference -= duration * 60;
          globals.incrementState();
          if (globals.state == 'working') {
            globals.pomodoroNumber++;
          }
        }
      } while (true)

    } else {
      globals.secondsToEnd -= timeDifference;
      console.log(`globals.secondsToEnd=${globals.secondsToEnd}`);
    }
  }
}