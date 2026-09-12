# Changelog

## 2026-09-12 — "Saved on this device" dates for Garmin and Intervals.icu

Garmin's "Authenticated with Garmin Connect" notice and the Intervals.icu
"Connected as..." line now show when the credentials were last saved on this
device, matching the date already shown for the Hevy API key.

## 2026-09-11 — App logo

Replaced the blue favicon with a black badge and white barbell mark, now the
official app icon. The same mark appears in the top navbar, using the app's
theme tokens so it inverts to a light badge in dark mode for contrast.

## 2026-09-11 — View the connected Hevy API key in Settings

Settings now shows the connected Hevy API key, hidden by default with an eye
toggle to reveal it, along with the date it was saved and a "Forget" link.

## 2026-09-10 — Push structured runs to Garmin via Intervals.icu

Paste a JSON array of running workouts; the app compiles each into Intervals.icu's
Workout Builder syntax and creates it as a new calendar event via their API, which
syncs to the watch through the athlete's existing Intervals.icu → Garmin link.
