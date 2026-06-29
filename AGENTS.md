

Mirza Project Development Guide

Project Overview

This document describes the current development rules.
It does not require changing the existing project structure.
Any architectural refactor must be explicitly requested.

Mirza is a Persian-first personal finance application built with:

* React 18
* Vite
* Capacitor (Android)
* RTL Layout
* Mobile-first Design

The project is designed to be maintainable, modular, and safe for incremental development.

⸻

Core Principles

Always inspect the existing implementation before making changes.

Never rewrite working code unless explicitly requested.

Prefer extending existing components over creating new ones.

Make the smallest possible safe change.

Never remove existing functionality.

Never modify project architecture without approval.

Preserve previous user work.

⸻

UI Rules

The UI is:

* Persian-first
* RTL-first
* Mobile-first

Always preserve:

* spacing
* typography
* colors
* component hierarchy
* animations
* scrolling behavior
* bottom navigation
* sheet behavior

Do not redesign screens unless requested.

Reuse existing UI components whenever possible.

⸻

React Rules

Project stack:

* React
* Vite
* Functional Components
* Hooks

Prefer:

* existing hooks
* existing helper functions
* existing components

Avoid introducing new libraries unless requested.

Do not introduce Redux or another state management library unless explicitly asked.

⸻

Styling Rules

Global styles are loaded through:

src/styles/index.css

This file imports:

src/styles.css

Do not change this structure unless requested.

Future global style files should be imported from:

src/styles/index.css

Avoid:

* inline styles
* duplicated CSS
* hardcoded colors
* duplicated spacing values

⸻

Folder Structure

Main application lives inside:

src/

Important folders:

components/
Reusable UI components.

components/records/
Record-related UI.

components/settings/
Settings UI.

pages/
Application screens.

hooks/
Custom React hooks.

helpers/
Business logic related to finance, records, dates, formatting and calculations.

utils/
Generic reusable utilities.

services/
Persistence layer (LocalStorage).

constants/
Static configuration.

data/
Development/sample data only.

i18n/
Localization.

styles/
Global stylesheet entry point.

⸻

Data Rules

Never replace real application data with sample data.

sampleData.js is development-only.

Keep business logic inside helpers.

Keep persistence inside services.

⸻

Component Rules

Before creating a component:

1. Search for an existing one.
2. Reuse if possible.
3. Keep components focused on a single responsibility.

Avoid duplicated UI.

⸻

Editing Rules

Before editing:

* inspect related files
* understand dependencies
* preserve existing APIs

After editing:

Report:

* Summary
* Changed files
* How to test
* Build/output location
* Notes/Risks

⸻

Build Rules

Only run commands when needed.

Typical workflow:

npm install
npm run build

If lint exists:

npm run lint

For Android:

npm run android:sync

Only sync Capacitor after a successful web build.

⸻

Git Rules

Do not commit automatically.

Do not rewrite Git history.

Never force push.

Keep commits focused and descriptive.

⸻

Documentation Rules

Whenever architecture changes:

Update documentation inside:

docs/

Relevant documentation includes:

* PROJECT_STRUCTURE.md
* ARCHITECTURE.md
* COMPONENTS.md
* DEVELOPMENT.md
* ARTIFACTS.md

⸻

Output Rules

Always report:

1. Summary
2. Changed files
3. How to test
4. Build/output location
5. Notes and risks