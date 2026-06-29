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
* Do not introduce new libraries without approval.

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