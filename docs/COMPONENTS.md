Components

Overview

This document describes the component organization of the Mirza project.

The project follows a reusable component architecture.

Before creating a new component, always check whether an existing component can be reused or extended.

⸻

Shared Components

Location:

src/components/

These components are shared across multiple pages.

Examples include:

* AmountDisplay
* AmountInput
* BottomNav
* JalaliDateInput
* RecordDetailSheet
* UndoSnackbar
* UI

⸻

Record Components

Location:

src/components/records/

Responsibilities:

* Display records
* Edit records
* Record actions
* Record forms
* Record toolbars

⸻

Settings Components

Location:

src/components/settings/

Responsibilities:

* Settings UI
* Contact management
* Manager information

⸻

Component Rules

* Keep components small.
* Prefer composition over duplication.
* Do not place business logic inside components.
* Reuse existing components whenever possible.
* Preserve RTL layout.
* Preserve the existing design system.
* Avoid creating duplicate UI patterns.

⸻

When to Update

Update this document whenever:

* A reusable component is added.
* A component is removed.
* A component responsibility changes.
* A new component folder is introduced.