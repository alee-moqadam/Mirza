Architecture

Overview

Mirza is a personal finance application built with React, Vite, and Capacitor.

The architecture is designed around the following principles:

* Scalability
* Readability
* Separation of Concerns
* Component Reusability
* Incremental Development without breaking the existing project

⸻

Application Flow

main.jsx
      │
      ▼
App.jsx
      │
      ▼
Pages
      │
      ▼
Components

Description

* main.jsx is the application’s entry point.
* App.jsx initializes the application and controls the global layout.
* Pages represent top-level application screens.
* Components are reusable UI building blocks shared across the application.

⸻

Data Flow

Pages / Components
          │
          ▼
        Hooks
          │
          ▼
       Helpers
          │
          ▼
 Storage Repository
          │
          ▼
      Services
          │
          ▼
     LocalStorage

Description

Hooks

Hooks are responsible for managing application state.

Helpers

Business logic is implemented inside the helper layer, including:

* Financial calculations
* Date conversion
* Number and currency formatting
* Record processing

Services

All communication with persisted finance data is handled through the service layer.

Components should never access LocalStorage directly.

Storage Repository

The app is moving toward an offline-first storage architecture through:

src/services/storage/storageRepository.js

Hooks should use this repository as the public data access layer. The repository currently delegates to the existing localStorage service so existing user data remains available and unchanged.

⸻

State Management

The application currently uses custom React Hooks for state management.

Main hooks include:

* useFinanceData
* useRecords
* useSettings
* useUndoAction

Do not introduce Redux or any additional state management library unless explicitly requested.

⸻

UI Architecture

The user interface follows these principles:

* Mobile First
* RTL First
* Persian First

Pages should compose reusable components instead of containing business logic.

Reusable components are located in:

src/components/

Feature-specific components are organized inside:

src/components/records/
src/components/settings/

⸻

CSS Architecture

Global stylesheet entry point:

src/styles/index.css

This file imports:

src/styles.css

Future global stylesheet files should be imported only through:

src/styles/index.css

Avoid using inline styles whenever possible.

⸻

Localization

The application is designed for Persian users.

Core localization principles:

* RTL layout
* Persian UI
* Jalali calendar
* Persian number formatting (when required)

Localization resources are stored inside:

src/i18n/

⸻

Data Persistence

Application data is currently stored using:

src/services/localStorageService.js

The offline-first storage boundary is:

src/services/storage/

This folder contains repository, migration, local database, sync queue, and sync service boundaries. SQLite/native storage and backend synchronization are planned but not implemented yet.

Existing localStorage data remains the fallback and migration source. Migration must be safe and must not delete existing localStorage data.

Components should never communicate directly with LocalStorage.

All persistence logic belongs inside the service layer.

⸻

Android Architecture

The Android application is generated through Capacitor.

Build process:

React Build
      │
      ▼
Capacitor Sync
      │
      ▼
Android Project

Generated Android build files should not be modified manually unless explicitly required.

⸻

Architecture Rules

* Keep UI separate from business logic.
* Keep business logic inside the helper layer.
* Keep persistence inside the service layer.
* Reuse existing components before creating new ones.
* Reuse existing hooks before introducing new state logic.
* Prefer small, incremental changes.
* Do not change the project architecture unless explicitly requested.

⸻

When to Update This Document

Update this document whenever one of the following changes:

* Project folder structure
* Backend or API integration
* State management strategy
* CSS architecture
* Data persistence strategy
* Major application features
* Android build workflow
* Main page organization
