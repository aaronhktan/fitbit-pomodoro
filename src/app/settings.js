import * as fs from 'fs';

export default class Settings {
  _pomodoroDuration = 25;
  _shortRestDuration = 5;
  _longRestDuration = 15;
  _continueOnResume = false;
  _currentSettingsVersion = 2;
  
  constructor() {
    try {
      let restoredSettings = fs.readFileSync('settings.txt', 'cbor');
      if (restoredSettings) {
        if (restoredSettings.pomodoroDuration !== undefined) {
          this._pomodoroDuration = restoredSettings.pomodoroDuration;
        }
        if (restoredSettings.shortRestDuration !== undefined) {
          this._shortRestDuration = restoredSettings.shortRestDuration;
        }
        if (restoredSettings.longRestDuration !== undefined) {
          this._longRestDuration = restoredSettings.longRestDuration;
        }
        if (restoredSettings.continueOnResume !== undefined) {
          this._continueOnResume = restoredSettings.continueOnResume;
        }
        if (restoredSettings.version !== undefined) {
          if (restoredSettings.version >= 2) {
            if (restoredSettings.continueOnResume !== undefined) {
              this._continueOnResume = restoredSettings.continueOnResume;
            }
          }
        }
      }
    } catch (e) {
      console.log('Settings not found; defaulting to presets.');
    }
  }
  
  save() {
    let json_data = {
      'pomodoroDuration': this._pomodoroDuration,
      'shortRestDuration': this._shortRestDuration,
      'longRestDuration': this._longRestDuration,
      'continueOnResume': this._continueOnResume,
      'version': this._currentSettingsVersion,
    }
    fs.writeFileSync('settings.txt', json_data, 'cbor');
  }

  get pomodoroDuration() {
    return this._pomodoroDuration;
  }

  set pomodoroDuration(duration) {
    this._pomodoroDuration = duration;
    this.save();
  }
  
  get shortRestDuration() {
    return this._shortRestDuration;
  }

  set shortRestDuration(duration) {
    this._shortRestDuration = duration;
    this.save();
  }
  
  get longRestDuration() {
    return this._longRestDuration;
  }

  set longRestDuration(duration) {
    this._longRestDuration = duration;
    this.save();
  }

  getCurrentDuration(state) {
    switch (state) {
      case 'working':
      case 'working-paused':
        return this._pomodoroDuration;
        break;
      case 'shortResting':
      case 'shortResting-paused':
        return this._shortRestDuration;
        break;
      case 'longResting':
      case 'longResting-paused':
        return this._longRestDuration;
        break;
      default:
        break;
    }
  }
  
  get continueOnResume() {
    return this._continueOnResume;
  }

  set continueOnResume(option) {
    this._continueOnResume = option;
    this.save();
  }
  
  get totalDuration() {
    return this._pomodoroDuration * 4 + this._shortRestDuration * 3 + this._longRestDuration;
  }
}