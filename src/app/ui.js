import document from 'document';

export default class UI {
  _backgroundRect;
  _btnTRReset;
  _btnTRForward;
  _btnBRPlay;
  _btnBRPause;
  _pomodoroText;
  _stateText;
  _minuteText;
  _unitText;

  constructor() {
    this._backgroundRect = document.getElementById('backgroundRect');
    this._btnTRReset = document.getElementById('btnTRReset');
    this._btnTRForward = document.getElementById('btnTRForward');
    this._btnBRPlay = document.getElementById('btnBRPlay');
    this._btnBRPause = document.getElementById('btnBRPause');
    this._pomodoroText = document.getElementById('pomodoroText');
    this._stateText = document.getElementById('stateText');
    this._minuteText = document.getElementById('minuteText');
    this._unitText = document.getElementById('unitText');
  }
  
  setButtonsPaused() {
    this._btnTRReset.style.display = 'inline';
    this._btnTRForward.style.display = 'none';
    this._btnBRPlay.style.display = 'inline';
    this._btnBRPause.style.display = 'none';
  }
  
  setButtonsUnpaused() {
    this._btnTRReset.style.display = 'none';
    this._btnTRForward.style.display = 'inline';
    this._btnBRPlay.style.display = 'none';
    this._btnBRPause.style.display = 'inline';
  }
  
  setButtonsReset() {
    this._btnTRReset.style.display = 'none';
    this._btnTRForward.style.display = 'none';
    this._btnBRPlay.style.display = 'inline';
    this._btnBRPause.style.display = 'none';
  }
  
  setLabelsUnpaused() {
    this._pomodoroText.style.display = 'inline';
    this._minuteText.style.display = 'inline';
    this._unitText.style.display = 'none';
  }
  
  setLabelsReset() {
    this._pomodoroText.style.display = 'none';
    this._minuteText.style.display = 'inline';
    this._unitText.style.display = 'inline';
  }
  
  get pomodoroRect() {
    return this._backgroundRect;
  }
  
  setPomodoroRectColours(state) {
    switch (state) {
      case 'initialize':
      case 'working':
      case 'working-paused':
        this._backgroundRect.gradient.colors.c1 = 'tomato';
        this._backgroundRect.gradient.colors.c2 = 'red';
        break;
      case 'shortResting':
      case 'shortResting-paused':
        this._backgroundRect.gradient.colors.c1 = 'mediumseagreen';
        this._backgroundRect.gradient.colors.c2 = 'seagreen';
        break;
      case 'longResting':
      case 'longResting-paused':
        this._backgroundRect.gradient.colors.c1 = 'royalblue';
        this._backgroundRect.gradient.colors.c2 = 'steelblue';
        break;
    }
  }
  
  get resetButton() {
    return this._btnTRReset;
  }
  
  get forwardButton() {
    return this._btnTRForward;
  }
  
  get playButton() {
    return this._btnBRPlay;
  }
  
  get pauseButton() {
    return this._btnBRPause;
  }
  
  get pomodoroLabel() {
    return this._pomodoroText;
  }
  
  get stateLabel() {
    return this._stateText;
  }
  
  setStateLabelText(state) {
    switch(state) {
      case 'initialize':
        this._stateText.text = 'Start a Pomodoro';
        break;
      case 'working':
        this._stateText.text = 'Get to work!';
        break;
      case 'shortResting':
        this._stateText.text = 'Take a short break';
        break;
      case 'longResting':
        this._stateText.text = 'Take a long break';
        break;
      case 'working-paused':
      case 'shortResting-paused':
      case 'longResting-paused':
        this._stateText.text = 'Paused...';
        break;
    }
  }
  
  get minuteLabel() {
    return this._minuteText;
  }
  
  setMinuteLabelText(secondsToEnd) {
    let minutes = Math.floor(secondsToEnd / 60);
    let seconds = secondsToEnd % 60;
    minutes = (minutes < 10) ? (`0${minutes}`) : minutes;
    seconds = (seconds < 10) ? (`0${seconds}`) : seconds;
    this._minuteText.text = `${minutes}:${seconds}`;
  }
  
  get unitLabel() {
    return this._unitText;
  }
}