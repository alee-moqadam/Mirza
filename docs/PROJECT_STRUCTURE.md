Project Structure

Overview

Mirza is a React + Vite + Capacitor application following a modular, mobile-first architecture.

The project is organized to separate:

* UI Components
* Pages
* Business Logic
* Data
* Services
* Styling
* Utilities

⸻

Root Structure

Mirza
├── src
├── public
├── android
├── assets
├── scripts
├── outputs
├── package.json
├── vite.config.js
└── README.md

⸻

src/

Contains the web application source code.

src/
├── components/
├── pages/
├── hooks/
├── helpers/
├── services/
├── constants/
├── data/
├── utils/
├── i18n/
├── styles/
├── App.jsx
└── main.jsx

⸻

components/

Reusable UI components.

Contains generic interface elements shared across multiple pages.

Subfolders:

* records/
* settings/

⸻

pages/

Top-level application screens.

Current pages include:

* Dashboard
* Records
* History
* Settings

Pages should compose existing components rather than implement business logic.

⸻

hooks/

Contains reusable custom React hooks.

Responsibilities include:

* application state
* finance state
* records
* settings
* undo actions

⸻

helpers/

Contains business logic.

Examples:

* calculations
* currency
* date conversion
* formatting
* record processing

Helpers should remain framework-independent whenever possible.

⸻

services/

Persistence layer.

Currently responsible for LocalStorage access.

External APIs should also live here in the future.

⸻

constants/

Application constants and configuration values.

Avoid hardcoding values inside components.

⸻

data/

Development-only sample data.

Production logic must not depend on sample data.

⸻

utils/

Generic reusable utility functions.

Utilities should not contain business-specific logic.

⸻

styles/

Global styling entry point.

Current loading order:

main.jsx
    ↓
styles/index.css
    ↓
styles.css

Future global styles should be imported through:

styles/index.css

⸻

Android

Native Android project managed through Capacitor.

Synchronization flow:

React Build
      ↓
Capacitor Sync
      ↓
Android Project

Native Android code should remain separated from the React application.

⸻

Outputs

Generated application packages are stored inside:

outputs/
releases/

These directories contain generated APK/AAB files.

⸻

Architecture Goals

The project follows these principles:

* Mobile First
* RTL First
* Component Reuse
* Separation of Concerns
* Incremental Development
* Maintainable Codebase