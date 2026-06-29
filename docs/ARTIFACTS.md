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

⸻

Rules

* Never edit generated artifacts.
* Keep source changes inside the source code.
* Generated files should only be committed when explicitly required.

⸻

When to Update

Update this document when:

* Build output locations change.
* Android workflow changes.
* New artifact types are added.