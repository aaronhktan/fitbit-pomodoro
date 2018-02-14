'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var document = _interopDefault(require('document'));
var haptics = require('haptics');

var backgroundRect = document.getElementById("backgroundRect");
var backgroundRectResting = document.getElementById("backgroundRectResting");
var backgroundRectLongResting = document.getElementById("backgroundRectLongResting");

var btnBR = document.getElementById("btn-br");
var stateText = document.getElementById("stateText");
var minuteText = document.getElementById("minuteText");
var unitText = document.getElementById("unitText");
var times = 0;

btnBR.onactivate = function (evt) {
  btnBR.style.display = "none";
  haptics.vibration.start("confirmation");
  minuteText.text = "24:59";
  unitText.style.display = "none";
  backgroundRect.animate("disable");
  setTimeout(function() {
    startWorkTimer(times);
  }, 300);
};

function startWorkTimer(times) {
    stateText.text = "Get to work!";
    backgroundRect.animate("enable");
    var end = new Date(new Date().getTime() + 25 * 60000);
    minuteText.text = "24:59";
    var timer = setInterval(function () {
        var now = new Date().getTime();
        var distance = end - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        minutes = (minutes < 10) ? ("0" + minutes) : minutes;
        seconds = (seconds < 10) ? ("0" + seconds) : seconds;
        minuteText.text = minutes + ":" + seconds;
        if (distance < 1) {
          clearInterval(timer);
          haptics.vibration.start("ping");
          backgroundRect.animate("disable");
          times++;
          if (times < 2) {
            backgroundRectResting.animate("enable");
            startShortBreakTimer(times);
          } else {
            times = 0;
            backgroundRectLongResting.animate("enable");
            startLongBreakTimer(times);
          }
        }
    }, 1000);
};

function startShortBreakTimer(times) {
    stateText.text = "Take a short break";
    var end = new Date(new Date().getTime() + 5 * 60000);
    minuteText.text = "04:59";
    var timer = setInterval(function () {
        var now = new Date().getTime();
        var distance = end - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        minutes = (minutes < 10) ? ("0" + minutes) : minutes;
        seconds = (seconds < 10) ? ("0" + seconds) : seconds;
        minuteText.text = minutes + ":" + seconds;
        if (distance < 1) {
          clearInterval(timer);
          haptics.vibration.start("ping");
          backgroundRectResting.animate("disable");
          backgroundRect.animate("enable");
          startWorkTimer(times);
        }
    }, 1000);
}

function startLongBreakTimer(times) {
    stateText.text = "Take a long break";
    var end = new Date(new Date().getTime() + 15 * 60000);
    minuteText.text = "14:59";
    var timer = setInterval(function () {
        var now = new Date().getTime();
        var distance = end - now;
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        minutes = (minutes < 10) ? ("0" + minutes) : minutes;
        seconds = (seconds < 10) ? ("0" + seconds) : seconds;
        minuteText.text = minutes + ":" + seconds;
        if (distance < 1) {
            clearInterval(timer);
            haptics.vibration.start("ping");
            backgroundRectLongResting.animate("disable");
            backgroundRect.animate("enable");
            startWorkTimer(times);
        }
    }, 1000);
}