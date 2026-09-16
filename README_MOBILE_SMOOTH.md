# FORGE Premium — Mobile Smooth Build

This build keeps the existing FORGE design and supplied images unchanged.

Performance pass:
- Reduced GPU-heavy blur/backdrop-filter effects on mobile.
- Removed unnecessary transform/animation work from section background transitions.
- Faster section background cross-fade.
- Added image preloads for login and section backgrounds.
- Preserved the supplied login character, logo, and section background assets.
- Assets remain inside the package so relative image paths work when the folder is opened or hosted.

Open `index.html` from the `FORGE_PREMIUM` folder, or host the folder on a normal web server.
