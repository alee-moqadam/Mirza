Development

Environment

Required software:

* Node.js
* npm
* Git
* Android Studio (for Android builds)

⸻

Install

npm install

⸻

Development Server

npm run dev

⸻

Production Build

npm run build

⸻

Preview

npm run preview

⸻

Android

npm run android:sync
npm run android:open

⸻

Development Rules

* Always inspect existing code first.
* Keep changes incremental.
* Preserve RTL behavior.
* Preserve Persian UI.
* Reuse components before creating new ones.
* Keep business logic inside helpers.
* Keep persistence inside services.
* Route finance data access through src/services/storage/storageRepository.js when practical.
* Keep existing localStorage data as the migration source until the offline database is implemented.
* Do not introduce new libraries without approval.

⸻

Offline-First Storage

The app is preparing for offline-first local storage.

Current behavior:

* localStorage remains the active persistence fallback.
* src/services/localStorageService.js must stay in place.
* src/services/storage/storageRepository.js is the public data access boundary for future hook migrations.
* src/services/storage/migrationService.js tracks safe, idempotent migration metadata.
* Backend sync is planned but not implemented.
* Native SQLite/local database storage is planned but not implemented.

Do not delete or replace existing localStorage user data during migration work.

⸻

Git Workflow

git status
git add .
git commit -m "Describe the change"
git push

⸻

Build Verification

After changes:

* Run npm run build
* Fix build errors before committing.
* Report changed files.
