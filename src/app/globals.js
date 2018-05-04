import * as fs from 'fs';

export default class Globals {
  _pomodoroNumber = 0;
  _secondsToEnd = 15 * 60;
  _timer = false;
  _timerSet = false;
  _state = 'initialize';
  // Possible states are initialize, working, 
  // shortResting, longResting, working-paused, 
  // shortResting-paused, and longResting-paused
  _lastTimestamp = 0;
  _isAnimating = false;
  _currentGlobalsVersion = 2;

  constructor() {
    try {
      var lastState = fs.readFileSync('lastState.txt', 'cbor');
      if (lastState) {
        if (lastState.state !== undefined) {
          this._state = lastState.state;
        }
        if (lastState.secondsToEnd !== undefined) {
          this._secondsToEnd = Math.floor(lastState.secondsToEnd);
        }
        if (lastState.pomodoroNumber !== undefined) {
          this._pomodoroNumber = lastState.pomodoroNumber;
        }
        if (lastState.timestamp !== undefined) {
          this._lastTimestamp = lastState.timestamp;
        }
      }
    } catch (e) {
      console.log('Last state not found, defaulting to presets.', e);
    }
  }
  
  save() {
    let json_data = {
      'pomodoroNumber': this._pomodoroNumber,
      'state': this._state,
      'secondsToEnd': this._secondsToEnd,
      'timestamp': Date.now(),
      'version': this._currentGlobalsVersion,
    }
    fs.writeFileSync('lastState.txt', json_data, 'cbor');
  }

  userIsPaused() {
    return (this._state == 'initialize' ||
            this._state == 'working-paused' ||
            this._state == 'shortResting-paused' ||
            this._state == 'longResting-paused');
  }

  pauseState() {
    if (this._state == 'working') {
      this._state = 'working-paused';      
    } else if (this._state == 'shortResting') {
      this._state = 'shortResting-paused';
    } else if (this._state == 'longResting') {
      this._state = 'longResting-paused';
    }
  }

  unpauseState() {
    if (this._state == 'working-paused') {
      this._state = 'working';      
    } else if (this._state == 'shortResting-paused') {
      this._state = 'shortResting';
    } else if (this._state == 'longResting-paused') {
      this._state = 'longResting';
    }
  }

  incrementState() {
    switch (this._state) {
      case 'working':
      case 'working-paused':
        this._state = this._pomodoroNumber % 4 ? 'shortResting' : 'longResting';
        break;
      case 'shortResting':
      case 'shortResting-paused':
      case 'longResting':
      case 'longResting-paused':
        this._state = 'working';
        break;
      default:
        break;
    }
  }

  get pomodoroNumber() {
    return this._pomodoroNumber;
  }

  set pomodoroNumber(value) {
    this._pomodoroNumber = value;
  }

  get secondsToEnd() {
    return this._secondsToEnd;
  }

  set secondsToEnd(seconds) {
    this._secondsToEnd = seconds;
  }

  resetSecondsToEnd(pomodoroDuration, shortRestDuration, longRestDuration) {
    switch (this._state) {
      case 'working':
      case 'working-paused':
        let duration = pomodoroDuration;
        break;
      case 'shortResting':
      case 'shortResting-paused':
        let duration = shortRestDuration;
        break;
      case 'longResting':
      case 'longResting-paused':
        let duration = longRestDuration;
        break;
      default:
        break;
    }
    this._secondsToEnd = duration * 60;
  }

  get timer() {
    return this._timer;
  }

  set timer(timer) {
    this._timer = timer;
  }
  
  get timerSet() {
    return this._timer;
  }

  set timerSet(flag) {
    this._timerSet = flag;
  }
  
  get state() {
    return this._state
  }

  set state(option) {
    if (option == 'initialize' || option == 'working' ||
        option == 'shortResting' || option == 'longResting' ||
        option == 'working-paused' || option == 'shortResting-paused' ||
        option == 'longResting-paused') {
      this._state = option;
    } else {
      this._state = 'initialize';
    }
  }

  get lastTimestamp() {
    return this._lastTimestamp;
  }

  get isAnimating() {
    return this._isAnimating;
  }

  set isAnimating(flag) {
    this._isAnimating = flag;
  }
}