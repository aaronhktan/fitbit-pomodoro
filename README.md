# <img src="/docs/icon/icon.png?raw=true" height="48"> Fitbit Pomodoro
A Pomodoro app for the Fitbit Ionic.

"Take Tomatina, for example: it's a cute pomodoro timer that fits into Fitbit OS so well that I'm shocked the company didn't make the app itself."

-- Valentina Palladino, [Ars Technica](https://arstechnica.com/gadgets/2018/03/fitbit-versa-review-slowly-but-surely-pushing-fitbit-past-the-fit-bit/) review of the Fitbit Versa

## Build and install

### In Fitbit Studio

- Create a new project in Fitbit Studio, then drag and drop the contents of `src` into the side bar.
- Connect to the Fitbit Developer Bridge from your phone (tap your watch, then developer menu, then toggle on Developer Bridge), and your watch (Settings app, scroll down, tap on Developer Bridge).
- Click the Build button to build and install.

### Using Command Line Tools

Prerequisite: You'll need NPM installed.

- In the src directory (`cd src`), run `npx fitbit-build` and `npx fitbit`.
- Connect to the Fitbit Developer Bridge from your phone (tap your watch, then developer menu, then toggle on Developer Bridge), and your watch (Settings app, scroll down, tap on Developer Bridge).
- Once both are connected, back to the computer. At the Fitbit prompt, run `connect phone`, `connect device`, then `install` to install the app on the Ionic, Versa, and companion on your phone.
- To build, run `build` at the Fitbit prompt.

## Gallery

![Tomatina Main Screen](/docs/screenshots/Tomatina-Start.png?raw=true)
![Tomatina Short Break](/docs/screenshots/Tomatina-Short_Break.png?raw=true)
![Tomatina Working](/docs/screenshots/Tomatina-Progress.png?raw=true)
![Tomatina Long Break Paused](/docs/screenshots/Tomatina-Paused.png?raw=true)

![Tomatina Main Screen](/docs/screenshots/Tomatina-Start~Versa.png?raw=true)
![Tomatina Short Break](/docs/screenshots/Tomatina-Short_Break~Versa.png?raw=true)
![Tomatina Working](/docs/screenshots/Tomatina-Progress~Versa.png?raw=true)
![Tomatina Long Break Paused](/docs/screenshots/Tomatina-Paused~Versa.png?raw=true)
