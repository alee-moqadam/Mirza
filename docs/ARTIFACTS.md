Artifacts

Web Build

Command:

npm run build

Output:

dist/

⸻

Android Build

Generated outputs may exist in:

android/app/build/outputs/
native-android/app/build/outputs/
outputs/
releases/

⸻

Artifact Types

* APK
* AAB
* Production Build
* Development Build
* localStorage migration metadata

⸻

Rules

* Never edit generated artifacts.
* Keep source changes inside the source code.
* Generated files should only be committed when explicitly required.
* localStorage remains a runtime data source and is not a generated artifact.
* Migration metadata records completion only; it must not remove existing user data.

⸻

When to Update

Update this document when:

* Build output locations change.
* Android workflow changes.
* New artifact types are added.
