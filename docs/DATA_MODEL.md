# Data Model

## Overview

Mirza is a Persian-first, local-first personal finance application.

The application is designed to work completely offline while providing a safe path toward scheduled synchronization with an online backend.

The primary objective of this data model is to create a stable foundation that supports:

- Offline-first usage
- Local database storage
- Future backend integration
- Scheduled synchronization
- Multi-device support
- Safe migration from localStorage
- Long-term scalability

This document defines the domain model for the Mirza project and should be considered the single source of truth for all persistence-related decisions.

---

# Design Goals

The data model should satisfy the following goals.

## Local First

The application must continue working even if:

- There is no internet connection.
- The backend is unavailable.
- The user has never logged in.
- Synchronization is disabled.

Local data always has priority on the device.

---

## Offline First

Every feature should work without requiring immediate communication with the backend.

Synchronization should happen later.

---

## Safe Migration

Existing users already have financial information stored inside localStorage.

Migration to SQLite or another local database must never:

- Delete existing data.
- Duplicate records.
- Break the UI.
- Require manual user intervention.

Migration must be repeatable and idempotent.

---

## Future Backend

The backend is planned for future versions.

The data model must support:

- Authentication
- User accounts
- Cloud backup
- Scheduled synchronization
- Multi-device access

without requiring changes to the UI.

---

## Scalability

The data model should support future features including:

- Attachments
- Notifications
- Tags
- Shared accounts
- Budgets
- Investments
- Reports
- Analytics

without requiring major structural changes.

---

# Core Principles

Mirza follows these architectural principles.

## Explicit Entities

Business concepts should be modeled as independent entities.

For example:

- Loan
- Check
- BankAccount

should not simply be stored as generic transaction rows.

---

## Stable Relationships

Relationships should use identifiers rather than nested duplicated objects.

Example:

```text
Record

↓

loanId

↓

Loan
```

instead of embedding the full Loan object inside every Record.

---

## Soft Delete

Entities should never be permanently removed immediately.

Instead:

```text
deletedAt
```

should be populated.

This enables:

- Synchronization
- Recovery
- Auditing
- Conflict handling

---

## Versioning

Every syncable entity should support optimistic versioning.

Example:

```text
version = 5
```

Each successful modification increments the version.

---

## Local Ownership

The device owns the working copy of the data.

The backend stores a synchronized copy.

The backend should never replace local information without conflict resolution.

---

## Non-destructive Synchronization

Synchronization should:

- Never overwrite unsynced local data.
- Never silently discard conflicts.
- Never remove records because they do not yet exist on the server.

---

## UI Compatibility

Internal storage may evolve over time.

However:

- Existing hooks
- Existing pages
- Existing components

must continue receiving compatible data.

Breaking the UI is not acceptable.

---

# Architecture Philosophy

Mirza is designed using a layered architecture.

```text
UI Components
        │
        ▼
Hooks
        │
        ▼
Repository Layer
        │
        ▼
Storage Layer
        │
        ▼
Synchronization Layer
        │
        ▼
Backend API
        │
        ▼
Online Database
```

Each layer has a single responsibility.

---

## Layer Responsibilities

### UI

Responsible only for displaying information.

Must not know how data is stored.

---

### Hooks

Responsible for application state.

Hooks orchestrate business operations.

Hooks do not perform persistence directly.

---

### Repository

Responsible for:

- Reading data
- Writing data
- Updating data
- Mapping entities
- Migration compatibility
- Preparing sync payloads

---

### Storage

Responsible for:

- SQLite
- Native storage
- localStorage (legacy)

The storage layer should never contain UI logic.

---

### Sync Layer

Responsible for:

- Uploading local changes
- Downloading remote changes
- Conflict detection
- Queue processing
- Retry logic

---

### Backend

Responsible for:

- Authentication
- Cloud storage
- Multi-device synchronization
- Long-term persistence

---

# UI Compatibility Rule

The existing Persian RTL interface must remain unchanged while the internal storage evolves.

Current pages should continue receiving compatible data structures.

Compatibility should be maintained through:

- Repository Layer
- Mapping
- Adapters
- Selectors

Final decision:

```text
UI must stay compatible through mapping/adapters.
```

Example:

```text
SQLite Entity

↓

Repository

↓

Adapter

↓

Current React UI
```

The UI should not be aware of normalization or database implementation.

---

# Identifier Strategy

Every persistent entity should support two identifiers.

## localId

Generated on the device.

Characteristics:

- Stable
- Never changes
- Used by the UI
- Used by Repository
- Used during synchronization

Recommended format:

```text
UUID
```

---

## serverId

Generated by the backend.

Characteristics:

- Nullable before first sync.
- Never replaces localId.
- Used only for backend synchronization.

---

## Why Two IDs?

Keeping both identifiers allows:

- Offline creation
- Scheduled synchronization
- Multi-device synchronization
- Safe migration
- Conflict resolution

without changing existing UI behavior.

---

## Identifier Rules

- localId is permanent.
- serverId is assigned only after successful synchronization.
- Backend must never overwrite localId.
- Repository maps localId and serverId internally.
- UI should always reference localId.

 ---

---

# Sync Metadata

Every syncable entity should support synchronization metadata.

These fields allow Mirza to work correctly in both offline and online modes.

## Common Sync Fields

| Field | Description |
|--------|-------------|
| localId | Permanent identifier generated on the device |
| serverId | Identifier assigned by backend after first sync |
| userId | Future owner of the entity |
| deviceId | Device that created or modified the entity |
| createdAt | Creation timestamp |
| updatedAt | Last modification timestamp |
| deletedAt | Soft delete timestamp |
| syncStatus | Current synchronization state |
| lastSyncedAt | Last successful synchronization |
| version | Local optimistic version number |

---

## Sync Status

Possible values:

```text
local
pending
synced
failed
deleted
conflict
```

Meaning:

### local

Entity only exists locally.

No synchronization has started.

---

### pending

Entity contains local changes waiting to be uploaded.

---

### synced

Local and server versions are synchronized.

---

### failed

Last synchronization attempt failed.

Retry is required.

---

### deleted

Entity was soft deleted locally.

Deletion must be synchronized.

---

### conflict

Both local and server changed.

Manual or automatic conflict resolution is required.

---

# Core Entities

Mirza separates financial concepts into independent entities.

Each entity has its own lifecycle.

## Financial Entities

```text
Record
Loan
Installment
Check
```

These entities represent financial events.

---

## Supporting Entities

```text
FinancialContact
Bank
BankAccount
Category
Settings
```

These entities provide relationships and metadata.

---

## Sync Entities

```text
User
Device
SyncQueueItem
```

These entities exist primarily for synchronization.

---

## Future Optional Entities

```text
Attachment
Notification
Reminder
Tag
AuditLog
```

These are intentionally separated so they can be introduced without breaking the existing database.

---

# Entity Relationships

## Overview

The domain model intentionally separates financial objects from financial events.

Example:

```text
Loan
```

is not

```text
Record
```

Instead

```text
Loan
        │
        ├── Installment
        │
        └── Record
```

A payment generates a Record.

The Loan itself is not a Record.

---

## Relationship Diagram

```text
User
│
├── Settings
│
├── Device
│
├── Category
│
├── FinancialContact
│
├── BankAccount
│
├── Loan
│
├── Check
│
├── Record
│
└── SyncQueueItem
```

---

## Bank Relationships

```text
Bank
│
└── BankAccount
```

One bank can have multiple accounts.

Example:

```text
Mellat

├── Salary Card

├── Business Account

└── Savings Account
```

---

## BankAccount Relationships

```text
BankAccount

├── Record

├── Loan

├── Check
```

Money always comes from or goes into a BankAccount.

---

## FinancialContact Relationships

```text
FinancialContact

├── Record

├── Loan

└── Check
```

A contact may participate in many financial objects.

---

## Loan Relationships

```text
Loan

├── Installment

└── Record
```

Loan payments are represented as Records.

Installments belong to one Loan only.

---

## Installment Relationships

```text
Installment

└── Record
```

Each installment may create zero or one payment Record.

---

## Check Relationships

```text
Check

└── Record
```

The check itself is an entity.

Cash movement creates Records.

---

## Record Relationships

```text
Record

├── Category

├── FinancialContact

├── BankAccount

├── Loan

├── Installment

└── Check
```

A Record may reference one or more entities.

---

# Repository Layer

The Repository Layer separates the UI from persistence.

UI components should never know where data comes from.

Possible storage sources:

- localStorage
- SQLite
- Native database
- Backend API
- Cached Sync Data

The Repository exposes a stable interface to Hooks.

Example:

```text
UI

↓

Hooks

↓

Repository

↓

Storage
```

Changing storage technology should never require UI changes.

---

## Repository Responsibilities

The repository is responsible for:

- Reading entities
- Saving entities
- Updating entities
- Soft deleting entities
- Mapping legacy data
- Normalizing old structures
- Preparing sync payloads
- Returning UI-compatible models

---

## Repository Rules

Repositories should never:

- Render UI
- Show alerts
- Perform navigation
- Own React state

Repositories should only deal with domain data.

---

# Data Flow

## Current Flow

```text
UI

↓

Hooks

↓

localStorageService

↓

localStorage
```

---

## Target Flow

```text
UI

↓

Hooks

↓

Repository

↓

SQLite

↓

Sync Queue

↓

Sync Service

↓

Backend API

↓

PostgreSQL
```

---

## Migration Flow

```text
Legacy localStorage

↓

Migration Service

↓

Normalizer

↓

Repository

↓

SQLite

↓

UI Adapter

↓

Current UI
```

The migration must be completely transparent to the user.

---

## Data Ownership

Current source of truth:

```text
localStorage
```

Future source of truth:

```text
SQLite
```

Future backup:

```text
Backend Database
```

The backend is **not** the primary source of truth.

The device always owns the latest working copy.

---

## Offline Rule

The application must continue working when:

- Internet is unavailable.
- Authentication expires.
- Backend is offline.
- Sync is disabled.

No feature should require immediate internet access.

---

---

# Record

## Overview

A **Record** represents a financial event that affects balances or appears in the user's financial history.

Unlike other entities such as Loan or Check, a Record always represents an actual financial movement or accounting event.

Every visible transaction in the History page should ultimately be represented by a Record.

---

## Responsibilities

A Record is responsible for representing:

- Income
- Expense
- Receivable payment
- Payable payment
- Loan payment
- Check operation
- Transfer
- Opening balance
- Balance adjustment

---

## Record Types

Supported values:

```text
income
expense
receivable
payable
loanPayment
checkOperation
transfer
openingBalance
adjustment
```

Future versions may introduce additional specialized record types without changing the overall structure.

---

## Typical Fields

```text
localId
serverId
userId
deviceId

type

title
description

amount
currency

direction

date
jalaliDate

categoryId

bankAccountId

contactId

loanId

installmentId

checkId

notes

createdAt
updatedAt
deletedAt

syncStatus
lastSyncedAt
version
```

---

## Direction

Direction represents cash flow.

Possible values:

```text
inflow
outflow
```

Examples:

Income

```text
direction = inflow
```

Expense

```text
direction = outflow
```

Transfer

One transfer creates two Records.

One:

```text
outflow
```

Second:

```text
inflow
```

---

## Why Transfer Creates Two Records

Money leaves one account.

Money enters another account.

Those are two independent accounting events.

Example:

```text
Wallet

↓

-500

↓

Record #1
```

```text
Bank Account

↓

+500

↓

Record #2
```

The two records should reference each other using:

```text
transferGroupId
```

This preserves accounting correctness.

---

## Relationships

A Record may reference:

```text
Category

FinancialContact

BankAccount

Loan

Installment

Check
```

Most relationships are optional.

---

## Record Lifecycle

```text
Created

↓

Modified

↓

Synced

↓

Archived

↓

Soft Deleted
```

Records should never be physically removed immediately.

---

## Editing Rules

A Record may be edited while:

- Local only
- Pending sync
- Synced

When edited:

```text
version++

syncStatus = pending
```

---

## Delete Rules

Deleting a Record should:

- Populate deletedAt
- Mark syncStatus = deleted
- Create SyncQueue item

The physical row should remain.

---

## Record Validation

The following fields are required:

```text
type

amount

date

bankAccountId
```

Amount must always be greater than zero.

---

## Loan

## Overview

Loan represents an agreement between two parties.

A Loan is **not** a transaction.

Instead, it is a financial object that owns:

- Installments
- Payment Records

---

## Loan Direction

Possible values:

```text
receivable

payable
```

Meaning:

Receivable

Money should return to me.

Payable

I should pay someone else.

---

## Loan Status

Supported values:

```text
active

completed

overdue

cancelled

archived
```

---

## Typical Fields

```text
localId

serverId

userId

deviceId

title

contactId

bankAccountId

principalAmount

remainingAmount

interestRate

direction

startDate

endDate

status

notes

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Relationships

Loan

```text
Loan

├── Installment

└── Record
```

Loan never stores payments directly.

Payments are Records.

---

## Loan Lifecycle

```text
Created

↓

Active

↓

Installments Generated

↓

Payments Recorded

↓

Completed

↓

Archived
```

---

## Payment Flow

Example:

```text
Loan

↓

Installment

↓

Payment Record

↓

History Page
```

The History page only shows Records.

Loan details are resolved through relationships.

---

## Loan Rules

A Loan:

Can exist before any payment.

Can have zero installments.

Can have many installments.

Can have many payment Records.

Cannot directly change balances.

Balances change only through Records.

---

## Remaining Amount

The remaining amount should be calculated from:

```text
Principal

-

Paid Records
```

instead of storing independent duplicated values whenever possible.

---

## Installment

## Overview

Installment represents a scheduled payment belonging to a Loan.

Installments never exist independently.

Every Installment belongs to exactly one Loan.

---

## Status

Supported values:

```text
pending

partial

paid

overdue

cancelled
```

---

## Typical Fields

```text
localId

serverId

loanId

amount

paidAmount

dueDate

paidAt

paymentRecordId

status

notes

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Relationships

```text
Loan

↓

Installment

↓

Payment Record
```

---

## Installment Lifecycle

```text
Generated

↓

Pending

↓

Partial Payment

↓

Paid

↓

Archived
```

---

## Partial Payment

Mirza supports partial installment payments.

Example:

```text
Installment

10,000,000

↓

Payment

3,000,000

↓

Remaining

7,000,000
```

The installment remains:

```text
partial
```

until fully paid.

---

## Validation Rules

Amount must be positive.

Due date is required.

Loan reference is required.

Installments cannot exist without a Loan.

---

## Synchronization Rules

Installments synchronize independently from Loan.

This prevents sending the entire Loan object after every payment.

Only modified Installments should be synchronized.

---

# Check

## Overview

A **Check** represents a bank check as a financial entity.

A Check is not a transaction.

Instead, it is a financial instrument that may generate one or more financial transactions during its lifecycle.

For this reason, Check is modeled separately from Record.

---

## Responsibilities

A Check is responsible for representing:

- Issued checks
- Received checks
- Deposited checks
- Cleared checks
- Returned checks
- Cancelled checks
- Transferred checks

---

## Direction

Possible values:

```text
receivable
payable
```

Meaning:

Receivable

```text
Someone has given me a check.
```

Payable

```text
I have issued a check.
```

---

## Status

Supported values:

```text
issued

received

deposited

cleared

bounced

cancelled

transferred

expired
```

---

## Typical Fields

```text
localId

serverId

userId

deviceId

bankAccountId

contactId

checkNumber

serialNumber

amount

currency

issueDate

dueDate

direction

status

linkedRecordIds

notes

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Relationships

```text
Check

↓

Record
```

A Check may generate:

- zero Records
- one Record
- multiple Records

depending on its lifecycle.

---

## Example Lifecycle

```text
Check Created

↓

Issued

↓

Deposited

↓

Cleared

↓

Archived
```

or

```text
Check Created

↓

Issued

↓

Bounced

↓

Replacement Check

↓

Cleared
```

---

## Financial Effect

Creating a Check should **not** automatically change balances.

Balances change only when an actual financial event occurs.

Example:

```text
Issue Check

↓

No balance change
```

Later:

```text
Check Cleared

↓

Create Record

↓

Balance Updated
```

---

## Validation Rules

Required fields:

```text
checkNumber

amount

bankAccountId

direction

status
```

---

## Editing Rules

Checks may be edited while:

- issued
- received
- pending

A cleared or cancelled Check should have limited editable fields.

---

## Synchronization Rules

Checks synchronize independently.

Associated Records synchronize independently.

The backend should not require the entire Check object when only a payment Record changes.

---

# FinancialContact

## Overview

FinancialContact represents a person, company, organization, or institution involved in financial activities.

Contacts are shared across multiple entities.

---

## Typical Examples

```text
Friend

Customer

Supplier

Employee

Employer

Family Member

Bank Representative
```

---

## Typical Fields

```text
localId

serverId

userId

deviceId

title

firstName

lastName

company

relationTitle

mobile

phone

email

address

nationalId

notes

favorite

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Relationships

```text
FinancialContact

├── Record

├── Loan

├── Check

└── BankAccount
```

---

## Rules

A contact may exist even if:

- no Record exists
- no Loan exists
- no Check exists

Contacts are reusable.

---

## Delete Rules

Deleting a contact should never automatically delete:

- Loans
- Records
- Checks

Instead relationships should be preserved or marked appropriately.

---

# Bank

## Overview

A Bank represents a financial institution.

A Bank is **not** a user's account.

Examples:

```text
Mellat

Melli

Pasargad

Saman

Tejarat
```

---

## Typical Fields

```text
localId

serverId

title

englishTitle

code

icon

color

displayOrder

country

isActive

createdAt

updatedAt
```

---

## Relationships

```text
Bank

↓

BankAccount
```

One Bank

↓

Many BankAccounts

---

## Rules

Banks are generally system-managed.

Users normally create BankAccounts, not Banks.

Future updates may add new supported banks.

---

# BankAccount

## Overview

BankAccount represents where money is actually stored.

Examples:

```text
Cash

Wallet

Bank Account

Debit Card

Credit Card

Savings Account
```

Unlike Bank, BankAccount belongs to the user.

---

## Supported Types

```text
cash

wallet

bankAccount

card

creditCard

investment
```

---

## Typical Fields

```text
localId

serverId

userId

deviceId

bankId

ownerContactId

title

accountNumber

cardNumber

iban

currency

openingBalance

currentBalance

type

color

icon

isArchived

isDefault

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Relationships

```text
BankAccount

├── Record

├── Loan

├── Check
```

Every financial movement should reference a BankAccount whenever possible.

---

## Opening Balance

Opening balance represents the initial amount available when the account is created.

It should generate a Record of type:

```text
openingBalance
```

instead of directly modifying balances without history.

---

## Current Balance

CurrentBalance should preferably be calculated.

Preferred formula:

```text
Opening Balance

+

All Inflows

-

All Outflows
```

Avoid storing duplicated balance values whenever possible.

---

## Transfer Between Accounts

Transfers should create two linked Records.

Example:

```text
Wallet

↓

-2,000,000

↓

Transfer Record #1
```

```text
Bank Card

↓

+2,000,000

↓

Transfer Record #2
```

Both Records should share:

```text
transferGroupId
```

This preserves accounting integrity.

---

## Validation Rules

Required fields:

```text
title

type

currency
```

Bank reference is optional for:

```text
Cash

Wallet
```

but required for real bank accounts.

---

## Synchronization Rules

BankAccounts synchronize independently.

Related Records synchronize separately.

This minimizes synchronization payloads and prevents unnecessary updates.

---

# Category

## Overview

A **Category** classifies financial Records.

Categories help organize transactions for reporting, searching, filtering, budgeting, and analytics.

Categories do not store money.

They only classify financial events.

---

## Responsibilities

Categories are responsible for:

- Organizing Records
- Financial reports
- Statistics
- Filtering
- Budget grouping
- Dashboard summaries

---

## Supported Types

```text
income

expense

transfer

loan

check

general
```

Future versions may introduce additional specialized categories.

---

## Hierarchy

Categories support parent-child relationships.

Example:

```text
Expense

├── Food

├── Transportation

├── Healthcare

└── Shopping
```

---

## Typical Fields

```text
localId

serverId

userId

deviceId

title

icon

color

type

parentId

displayOrder

isSystem

isDefault

isArchived

createdAt

updatedAt

deletedAt

syncStatus

lastSyncedAt

version
```

---

## Rules

Categories should never directly own Records.

Records reference Categories.

```text
Record

↓

Category
```

---

## System Categories

Mirza may include predefined categories.

Examples:

```text
Food

Salary

Transportation

Shopping

Healthcare

Utilities
```

System categories should never disappear after updates.

Users may hide them if desired.

---

## User Categories

Users may create unlimited custom categories.

Examples:

```text
Freelancing

Crypto

Family

Business

Vacation
```

User categories synchronize normally.

---

## Validation Rules

Required fields:

```text
title

type
```

Category names should be unique within the same parent.

---

# Settings

## Overview

Settings stores application preferences.

Settings are not financial data.

Changing Settings should never modify financial records.

---

## Typical Fields

```text
localId

serverId

userId

language

locale

calendar

currency

theme

rtl

notifications

lockSettings

backupSettings

syncSettings

preferences

createdAt

updatedAt

syncStatus

lastSyncedAt

version
```

---

## Responsibilities

Settings manages:

- Language
- Theme
- Currency
- Calendar
- Security
- Notification preferences
- Sync preferences
- Backup preferences

---

## Rules

Each User should have only one Settings object.

```text
User

↓

Settings
```

---

## Synchronization

Settings synchronize independently.

Financial data should never wait for Settings synchronization.

---

# User

## Overview

User represents an online Mirza account.

The application must remain fully usable without a User.

Authentication is optional.

---

## Responsibilities

User owns:

- Settings
- Devices
- Financial data
- Sync information

---

## Typical Fields

```text
localId

serverId

displayName

firstName

lastName

email

phone

avatar

country

timezone

preferredLanguage

createdAt

updatedAt

deletedAt
```

---

## Authentication

Authentication is outside the scope of this document.

Possible future providers:

```text
Email

Google

Apple

Phone Number

OAuth
```

---

## Rules

Local users do not require authentication.

Online accounts become available only after login.

---

# Device

## Overview

Device represents a physical installation of Mirza.

Each phone, tablet, or desktop installation is a Device.

---

## Responsibilities

Device tracks:

- Sync ownership
- Device identity
- App version
- Platform
- Last synchronization

---

## Typical Fields

```text
localId

serverId

userId

deviceName

deviceModel

platform

operatingSystem

appVersion

installationDate

lastSyncAt

createdAt

updatedAt

deletedAt
```

---

## Relationships

```text
User

↓

Device
```

One User

↓

Many Devices

---

## Rules

Every local installation should have exactly one Device identifier.

Device identity helps resolve synchronization conflicts.

---

# SyncQueueItem

## Overview

SyncQueueItem represents one pending synchronization operation.

The queue guarantees that synchronization is reliable even when internet connectivity is unstable.

---

## Responsibilities

Queue items represent:

- Create
- Update
- Delete

operations.

---

## Typical Fields

```text
localId

entityType

entityLocalId

entityServerId

operation

payload

status

attempts

priority

lastError

createdAt

updatedAt

processedAt
```

---

## Operations

Supported values:

```text
create

update

delete
```

---

## Status

Supported values:

```text
pending

processing

synced

failed

cancelled
```

---

## Queue Rules

Queue processing must:

- Preserve operation order
- Avoid duplicate uploads
- Retry failures
- Never block local usage
- Continue after application restart

---

## Retry Strategy

Recommended retry sequence:

```text
1 Minute

5 Minutes

15 Minutes

30 Minutes

1 Hour

6 Hours

24 Hours
```

Retries should stop only after repeated permanent failures.

---

## Priority

Suggested priorities:

```text
Critical

High

Normal

Low
```

Example:

```text
Delete Account

↓

Critical
```

```text
Update Note

↓

Normal
```

---

## Queue Processing Flow

```text
Entity Modified

↓

Repository

↓

SyncQueue

↓

Background Sync Service

↓

Backend API

↓

Server Response

↓

Update Entity

↓

Remove Queue Item
```

---

## Queue Safety Rules

Queue processing must be:

- Idempotent
- Recoverable
- Crash-safe
- Transactional where possible

Queue items should never be removed until the backend confirms successful processing.

---

# Scheduled Sync Strategy

## Overview

Mirza follows a **Local-First** synchronization strategy.

All data is created and updated locally first.

Synchronization with the backend happens later under controlled conditions.

The application must never depend on a successful network request before allowing the user to continue working.

---

## Synchronization Principles

The synchronization engine must guarantee:

- Local-first operation
- Non-destructive synchronization
- Retryable synchronization
- Idempotent requests
- Incremental synchronization
- Safe conflict detection
- Background execution whenever possible

The local database is always considered the working copy.

The backend is considered the synchronized cloud copy.

---

## Synchronization Triggers

Synchronization may start when one of the following events occurs.

### Application Start

```text
Application Starts

↓

Check Network

↓

Check Login

↓

Process Sync Queue
```

---

### Application Returns to Foreground

```text
Foreground

↓

Check Pending Queue

↓

Start Scheduled Sync
```

---

### Network Becomes Available

```text
Offline

↓

Internet Available

↓

Begin Synchronization
```

---

### Scheduled Daily Sync

If the user is logged in and synchronization is enabled:

```text
Configured Time

↓

Start Background Sync
```

Recommended default:

```text
02:00 AM
```

The schedule should remain configurable.

---

### Manual Sync

The user may manually request synchronization.

```text
Settings

↓

Sync Now
```

Manual synchronization should use exactly the same synchronization engine.

---

# Synchronization Preconditions

Synchronization should begin only when:

- User is authenticated.
- Sync is enabled.
- Network is available.
- Local database is healthy.
- Previous synchronization is not already running.

Otherwise synchronization should be postponed.

---

# Push Flow

## Overview

Push uploads local modifications.

Only entities with pending changes should be uploaded.

---

## Push Sequence

```text
Repository

↓

Sync Queue

↓

Prepare Payload

↓

Backend API

↓

Server Validation

↓

Server Database

↓

Server Response

↓

Update Local Entity

↓

Mark Synced
```

---

## Push Steps

### Step 1

Load pending queue items.

```text
status = pending
```

---

### Step 2

Sort by creation order.

Older operations should be processed first.

---

### Step 3

Group operations.

Possible grouping:

```text
Record

Loan

Installment

Check

Category

Settings
```

---

### Step 4

Generate payload.

Payload should include:

- localId
- serverId
- version
- updatedAt
- entity data

---

### Step 5

Send request.

Requests should support retries.

---

### Step 6

Receive response.

Expected response:

```text
Success

ServerId

Version

UpdatedAt

Accepted
```

---

### Step 7

Update entity.

Repository updates:

```text
serverId

version

lastSyncedAt

syncStatus
```

---

### Step 8

Remove queue item.

Only after confirmation.

---

# Pull Flow

## Overview

Pull downloads remote modifications.

The server should only return data changed since the previous checkpoint.

---

## Pull Sequence

```text
Last Sync Checkpoint

↓

Backend

↓

Changed Entities

↓

Normalizer

↓

Repository

↓

SQLite

↓

UI
```

---

## Pull Steps

### Step 1

Send:

```text
deviceId

userId

lastCheckpoint
```

---

### Step 2

Receive changed entities.

Possible entities:

```text
Records

Loans

Installments

Checks

Contacts

BankAccounts

Categories

Settings
```

---

### Step 3

Normalize.

Incoming payload must match the local domain model.

---

### Step 4

Validate.

Reject malformed entities.

---

### Step 5

Compare versions.

Determine:

```text
No Change

Update

Conflict
```

---

### Step 6

Store changes.

Update SQLite.

Never bypass Repository.

---

### Step 7

Notify UI.

Hooks receive updated data automatically.

---

# Synchronization Checkpoint

Every successful synchronization produces a checkpoint.

Example:

```text
lastCheckpoint

2026-07-12T02:15:31Z
```

Future synchronization requests only ask for changes after this checkpoint.

---

# Conflict Handling

## Philosophy

Mirza prefers preserving data over automatic overwrites.

When unsure:

Keep both versions.

Never silently discard information.

---

## Conflict Detection

Conflict occurs when:

```text
Local Version

≠

Server Version
```

AND

Both were modified after the previous synchronization.

---

## Conflict Sources

Possible causes:

- Two devices edit the same Loan.
- User edits offline.
- Background sync runs later.
- Backend modifies data.
- Time differences.
- Simultaneous updates.

---

## Conflict Resolution Rules

Priority:

1.

No Conflict

↓

Apply Update

---

2.

Simple Merge

↓

Merge Safe Fields

---

3.

Manual Conflict

↓

Keep Both

↓

Ask User Later

---

## Safe Merge Examples

Possible automatic merges:

```text
Notes

Tags

Optional Metadata
```

---

## Unsafe Merge Examples

Never automatically merge:

```text
Amount

Currency

Direction

Loan Principal

BankAccount Balance
```

These require explicit conflict handling.

---

# Version Strategy

Each successful modification increments:

```text
version++
```

Repository controls version updates.

The UI must never modify versions directly.

---

# Idempotency

Every synchronization request must be idempotent.

Repeated uploads of the same operation must not create duplicate entities.

Recommended idempotency key:

```text
EntityType

+

localId

+

version
```

---

# Failure Recovery

If synchronization fails:

```text
Keep Queue

↓

Retry Later
```

Never remove unsynchronized data.

---

# Offline Rule

The application must continue operating while:

- Offline
- Backend unavailable
- Authentication expired
- Sync disabled
- Server maintenance

Users must never lose access to their local financial data because cloud synchronization is temporarily unavailable.

---

# Migration Strategy

## Overview

Mirza currently stores application data in `localStorage`.

Future versions will use a local database (SQLite) as the primary persistence layer.

Migration must be:

- Safe
- Incremental
- Non-destructive
- Repeatable
- Backward compatible

The user must never lose financial information during migration.

---

# Migration Principles

Migration must follow these rules:

- Never delete existing localStorage data.
- Never overwrite valid user data.
- Never duplicate records.
- Never interrupt normal application usage.
- Never require manual intervention.
- Always support rollback if migration fails.
- Always validate migrated data.

---

# Migration Flow

```text
Legacy localStorage

↓

Migration Service

↓

Normalizer

↓

Validation

↓

Repository

↓

SQLite

↓

Current UI
```

The UI must continue working exactly as before.

---

# Legacy Data Source

Current source:

```text
localStorageService.js
```

This file remains available during migration.

It acts as:

- Data source
- Fallback
- Recovery mechanism

It should not be removed until migration has been successfully completed for all users.

---

# Migration Detection

On application startup:

```text
App Starts

↓

Check SQLite

↓

Data Exists?

↓

YES → Continue

↓

NO

↓

Check localStorage

↓

Data Exists?

↓

YES

↓

Run Migration
```

Migration should execute only once.

---

# Migration Flag

After successful migration:

```text
migrationCompleted = true
```

Store this flag locally.

Future launches should skip migration.

---

# Normalization

Legacy data should never be written directly into SQLite.

Instead:

```text
Legacy Object

↓

Normalizer

↓

Domain Entity

↓

Validation

↓

Repository

↓

SQLite
```

Normalization ensures:

- Missing IDs are created.
- Missing timestamps are generated.
- Missing sync metadata is added.
- Relationships become consistent.

---

# Metadata Injection

Legacy entities may not contain:

```text
localId

version

syncStatus

createdAt

updatedAt
```

Migration should safely generate them.

Example:

Before:

```json
{
  "title": "Salary",
  "amount": 50000000
}
```

After:

```json
{
  "localId": "uuid",
  "title": "Salary",
  "amount": 50000000,
  "version": 1,
  "syncStatus": "local",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# Data Validation

Every migrated entity must be validated.

Validation includes:

- Required fields
- Numeric values
- Dates
- Relationships
- Entity types

Invalid entities should never stop migration.

Instead:

```text
Mark Error

↓

Continue Migration

↓

Report Later
```

---

# Relationship Reconstruction

Legacy objects may not contain references.

Migration should rebuild relationships.

Example:

```text
Loan Payment

↓

loanId

↓

Loan
```

instead of duplicated embedded data.

---

# Duplicate Detection

Migration must detect duplicates using:

- Existing localId
- Legacy identifier
- Stable hash
- Business rules

If a duplicate is detected:

```text
Skip Duplicate

↓

Continue
```

---

# Idempotency

Running migration multiple times must produce the same result.

Example:

```text
Run #1

↓

100 Records
```

Run again:

```text
Still

100 Records
```

Not:

```text
200 Records
```

---

# Rollback Strategy

If migration fails:

```text
Stop

↓

Keep localStorage

↓

Discard Partial SQLite Transaction

↓

Retry Later
```

The original data must remain untouched.

---

# Repository Compatibility

During migration:

```text
Repository

↓

SQLite Exists?

↓

YES

↓

Read SQLite

↓

NO

↓

Read localStorage
```

The UI should never know which storage source is active.

---

# Backward Compatibility

For a transition period:

```text
Current UI

↓

Repository

↓

SQLite

OR

localStorage
```

Both storage systems may coexist temporarily.

---

# Migration Logging

Migration should record:

- Start time
- End time
- Entity counts
- Failed entities
- Validation errors
- Duration
- Application version

Example:

```text
Migration Started

↓

145 Records

↓

8 Loans

↓

15 Checks

↓

Completed

↓

2.8 Seconds
```

---

# Recovery Strategy

If corruption is detected:

```text
SQLite

↓

Invalid

↓

Restore From localStorage

↓

Retry Migration
```

The application should always recover automatically whenever possible.

---

# Future Migration Support

Future schema upgrades should use versioned migrations.

Example:

```text
Schema v1

↓

Migration

↓

Schema v2

↓

Migration

↓

Schema v3
```

Every migration should be independent and repeatable.

---

# Repository Evolution

Current Repository:

```text
Repository

↓

localStorage
```

Future Repository:

```text
Repository

↓

SQLite

↓

Sync Queue

↓

Backend
```

No React component should require changes because of this evolution.

---

# Migration Success Criteria

Migration is considered successful only if:

- Every entity has been validated.
- Required metadata exists.
- No duplicate entities were created.
- All relationships were rebuilt.
- UI behaves exactly as before.
- Sync can safely start in future versions.
- Legacy localStorage remains available for recovery.

At this point, SQLite becomes the primary local storage while localStorage becomes a fallback only.

---

# Database Mapping Strategy

## Overview

The Mirza domain model should remain independent from the underlying database technology.

Whether the application stores data in:

- localStorage
- SQLite
- PostgreSQL
- another database

the domain model should remain unchanged.

Repositories are responsible for translating between domain entities and storage structures.

---

# Local Database

## SQLite

SQLite will become the primary local database.

Responsibilities:

- Offline persistence
- Fast local queries
- ACID transactions
- Local-first storage
- Sync source

SQLite is considered the local source of truth.

---

## SQLite Table Mapping

Suggested mapping:

```text
Record
↓

records
```

```text
Loan
↓

loans
```

```text
Installment
↓

installments
```

```text
Check
↓

checks
```

```text
FinancialContact
↓

financial_contacts
```

```text
Bank
↓

banks
```

```text
BankAccount
↓

bank_accounts
```

```text
Category
↓

categories
```

```text
Settings
↓

settings
```

```text
Device
↓

devices
```

```text
SyncQueueItem
↓

sync_queue
```

---

# Naming Convention

Use:

```text
snake_case
```

for database tables.

Example:

```text
bank_accounts
```

instead of

```text
BankAccounts
```

---

Columns should also use:

```text
snake_case
```

Example:

```text
created_at

updated_at

deleted_at

last_synced_at
```

---

# Primary Keys

Every table should contain:

```text
local_id
```

as the primary local identifier.

Example:

```text
TEXT PRIMARY KEY
```

The backend identifier remains:

```text
server_id
```

which is nullable until synchronization.

---

# Foreign Keys

Relationships should use foreign keys.

Example:

```text
records.loan_id

↓

loans.local_id
```

Another example:

```text
checks.bank_account_id

↓

bank_accounts.local_id
```

---

# Soft Delete

Every syncable table should contain:

```text
deleted_at
```

instead of physical deletion.

Deleted rows remain available for:

- Sync
- Recovery
- Audit
- Conflict handling

---

# Index Strategy

Recommended indexes:

```text
local_id
```

```text
server_id
```

```text
updated_at
```

```text
sync_status
```

```text
deleted_at
```

Frequently searched fields should also be indexed.

Example:

```text
loan_id

contact_id

bank_account_id

category_id
```

---

# Transactions

Database writes should use transactions whenever multiple entities are modified.

Example:

```text
Transfer

↓

Record #1

+

Record #2

+

Sync Queue Item
```

All operations should either succeed together or fail together.

---

# Repository Mapping

Repository converts:

```text
SQLite Row

↓

Domain Entity
```

and

```text
Domain Entity

↓

SQLite Row
```

The UI never works directly with database rows.

---

# Backend Database

## PostgreSQL

Future backend storage should use PostgreSQL.

Responsibilities:

- User accounts
- Cloud backup
- Multi-device synchronization
- Reporting
- Analytics

PostgreSQL is the cloud persistence layer.

---

# PostgreSQL Mapping

The backend should preserve the same domain model.

Example:

```text
SQLite

records

↓

PostgreSQL

records
```

Table names should remain consistent across environments.

---

# Identifier Mapping

Every synchronized entity stores both identifiers.

Example:

```text
local_id

server_id
```

Example flow:

```text
Phone

↓

local_id

↓

Sync

↓

Backend

↓

server_id

↓

Repository Update
```

The UI continues using:

```text
local_id
```

---

# Prisma

The backend should use Prisma ORM.

Each domain entity maps to one Prisma model.

Example:

```text
model Record
```

```text
model Loan
```

```text
model Installment
```

```text
model Check
```

```text
model FinancialContact
```

```text
model Bank
```

```text
model BankAccount
```

```text
model Category
```

---

# Prisma Relationships

Use explicit relations.

Example:

```text
Loan

1

↓

Many

Installments
```

Example:

```text
Bank

1

↓

Many

BankAccounts
```

Example:

```text
Category

1

↓

Many

Records
```

---

# Migration Strategy

Prisma migrations should be incremental.

Never rewrite production tables.

Preferred flow:

```text
Schema Change

↓

Migration

↓

Review

↓

Deploy
```

---

# Versioning

Database schema should maintain its own version.

Example:

```text
v1

↓

v2

↓

v3
```

Application migrations should be compatible with previous versions whenever possible.

---

# Performance Strategy

Repository should minimize unnecessary database reads.

Recommended practices:

- Lazy loading
- Pagination
- Indexed filtering
- Prepared statements
- Batch writes

---

# Backup Strategy

Local backup should eventually support:

- Manual export
- Scheduled backup
- Encrypted backup
- Cloud backup

Backup must never interrupt normal application usage.

---

# Security

Sensitive data should never be stored in plain text when encryption is available.

Future candidates for encryption:

- Account numbers
- Card numbers
- Personal notes
- Authentication tokens

Passwords should never be stored by Mirza.

Authentication is delegated to the backend.

---

# Database Independence

Mirza should never depend on SQLite-specific behavior.

Changing the storage engine should require changes only inside:

```text
Repository
```

and

```text
Storage Services
```

The rest of the application should remain unchanged.

---

# Future Expansion

## Overview

The Mirza data model is intentionally designed to support future features without requiring major architectural changes.

New capabilities should be introduced by adding new entities and relationships instead of modifying existing core entities whenever possible.

---

# Planned Future Modules

Possible future modules include:

- Budget Management
- Investment Portfolio
- Savings Goals
- Subscription Tracking
- Recurring Transactions
- Receipt Attachments
- Financial Reports
- Analytics Dashboard
- Shared Accounts
- Shared Budgets
- Business Accounts
- Tax Reports
- Currency Exchange
- AI Financial Insights

Each module should integrate through existing repositories rather than bypassing the architecture.

---

# Attachment Support

Future versions may allow users to attach files to financial entities.

Examples:

```text
Receipt

Invoice

Contract

Check Image

Identity Document
```

Suggested entity:

```text
Attachment
```

Relationships:

```text
Attachment

↓

Record
```

or

```text
Attachment

↓

Loan
```

or

```text
Attachment

↓

Check
```

Attachments should synchronize independently.

---

# Reminder Support

Future reminder entity:

```text
Reminder
```

Examples:

- Installment Due
- Check Due
- Loan Reminder
- Subscription Reminder

Reminder notifications should reference entities instead of duplicating information.

---

# Tag Support

Future entity:

```text
Tag
```

Examples:

```text
Family

Business

Vacation

Tax

Investment
```

Relationship:

```text
Record

↓

Many Tags
```

Tags provide flexible organization without changing Categories.

---

# Multi-Currency Support

Current versions primarily use one currency.

Future versions may support:

```text
IRR

IRT

USD

EUR

AED
```

Each financial entity should store its own currency.

Exchange rates should never modify historical Records.

Historical values must remain immutable.

---

# Performance Guidelines

The application should remain responsive even with very large datasets.

Target performance goals:

- Application startup under 2 seconds.
- Dashboard loading under 500 milliseconds.
- History scrolling remains smooth.
- Search results under 200 milliseconds when indexed.
- Synchronization should run in the background.

---

# Query Strategy

Repositories should:

- Filter in the database whenever possible.
- Avoid loading unnecessary entities.
- Use pagination for large result sets.
- Cache frequently accessed data.

Avoid reading the entire database for simple operations.

---

# Pagination

Large collections should support pagination.

Example:

```text
History

↓

50 Records

↓

Load More
```

instead of loading thousands of records at once.

---

# Caching

Frequently used entities may be cached.

Examples:

- Settings
- Categories
- Banks
- Frequently used Contacts

Caches must be invalidated after successful updates.

---

# Error Handling

Repository methods should return structured errors.

Example:

```text
Validation Error

Database Error

Sync Error

Network Error

Permission Error
```

The UI should receive user-friendly messages.

Internal implementation details should not be exposed.

---

# Logging

The application should support structured logging.

Recommended log categories:

```text
Migration

Repository

Database

Synchronization

Authentication

Performance
```

Sensitive user information should never appear in logs.

---

# Audit Strategy

Future versions may introduce an audit log.

Example entity:

```text
AuditLog
```

Example events:

```text
Loan Created

Loan Updated

Loan Deleted

Record Modified

Sync Started

Sync Completed
```

Audit logs help diagnose issues and improve reliability.

---

# Backup Strategy

Mirza should eventually support:

- Manual backup
- Automatic scheduled backup
- Cloud backup
- Local encrypted backup
- Restore from backup

Backup operations should not interrupt normal application usage.

---

# Restore Strategy

Restore should validate backup contents before replacing local data.

Suggested flow:

```text
Select Backup

↓

Validate

↓

Preview

↓

Restore

↓

Rebuild Relationships

↓

Success
```

Users should always have the option to cancel before data is replaced.

---

# Security Guidelines

Financial information should be protected both locally and during synchronization.

Recommended practices:

- Encrypt sensitive local data where appropriate.
- Use HTTPS for all backend communication.
- Validate all incoming server responses.
- Store authentication tokens securely.
- Never expose internal identifiers unnecessarily.

Passwords must never be stored by the mobile application.

---

# Privacy Principles

Mirza follows a privacy-first philosophy.

User financial information belongs to the user.

The backend exists only for synchronization and backup.

Whenever possible:

- Processing should happen locally.
- Reports should be generated locally.
- Analytics should avoid transmitting unnecessary personal data.

---

# Observability

Future versions should expose internal metrics for debugging.

Possible metrics:

- Database size
- Pending sync count
- Failed sync count
- Migration duration
- Queue processing time
- Last successful synchronization

These metrics are intended for diagnostics and should not affect user data.

---

# Maintainability

Future contributors should follow these rules:

- Preserve the domain model.
- Avoid duplicating business logic.
- Keep repositories independent from UI.
- Keep synchronization isolated from presentation.
- Prefer incremental changes over large rewrites.

Architecture documentation should always be updated alongside major structural changes.

---

# Final Decisions

The following architectural decisions have been finalized.

## Local First

Mirza is a local-first application.

The local database is always the primary source of truth.

The backend is used only for synchronization, backup, and multi-device access.

---

## Offline First

Every financial operation must work without internet access.

Synchronization should never block user interaction.

---

## Scheduled Synchronization

Synchronization should occur only when predefined conditions are satisfied.

Typical triggers include:

- Scheduled time
- Application start
- Application returns to foreground
- Internet becomes available
- Manual synchronization

Synchronization should not run continuously.

---

## UI Stability

Internal architecture may evolve.

The visible application should remain stable.

Repository adapters are responsible for maintaining UI compatibility.

---

## Domain-Driven Structure

Financial concepts are represented by dedicated entities.

Examples:

```text
Loan

Installment

Check

Record

BankAccount
```

These entities should never be collapsed into generic transaction rows.

---

## Repository Pattern

Repositories are the only layer allowed to communicate with persistence.

Repositories hide storage implementation details from:

- Hooks
- Components
- Pages

---

## Storage Independence

Mirza should support multiple storage engines.

Examples:

```text
localStorage

SQLite

IndexedDB

PostgreSQL
```

Changing storage technology should require changes only inside:

- Repository
- Storage Layer

---

## Synchronization Queue

Every modification intended for synchronization should generate a queue item.

The queue is responsible for:

- Ordering
- Retry
- Recovery
- Background processing

---

## Conflict Safety

Whenever conflicts cannot be resolved safely:

Keep both versions.

Never silently overwrite user data.

---

## Soft Delete

Entities should normally use:

```text
deletedAt
```

instead of immediate physical deletion.

This supports:

- Recovery
- Synchronization
- Auditing
- Rollback

---

## Migration Safety

Migration should always preserve:

- Existing data
- Relationships
- Identifiers
- User experience

Migration must remain idempotent.

---

# Open Decisions

The following topics remain intentionally undecided.

These decisions should be finalized during future development phases.

---

## Authentication Provider

Possible options:

```text
Email

Google

Apple

Phone Number

OAuth
```

---

## Local Database Library

Possible implementations:

```text
Capacitor SQLite

SQLite Plugin

Native SQLite

Other Local Database
```

---

## Backend Framework

Possible implementations:

```text
Express

NestJS

Fastify
```

---

## Identifier Format

Current recommendation:

```text
UUID
```

Alternative formats may be evaluated.

---

## Conflict Resolution Policies

Future versions should define:

- Per-entity rules
- Per-field rules
- User-assisted conflict resolution
- Automatic merge rules

---

## Synchronization Frequency

Default scheduled synchronization time should remain configurable.

Users may eventually define:

- Daily
- Weekly
- Manual only

---

## Encryption Strategy

Future decisions include:

- Database encryption
- Backup encryption
- Attachment encryption
- Key management

---

## Attachment Storage

Future implementations may support:

- Local storage
- Cloud storage
- Hybrid storage

---

## Shared Financial Data

Future versions may introduce:

- Shared accounts
- Family accounts
- Team workspaces

Relationship rules will be documented separately.

---

# Design Principles Summary

Every future change should respect these principles.

- Local First
- Offline First
- Repository Pattern
- Domain-Driven Design
- Explicit Entities
- Stable Relationships
- Safe Synchronization
- Non-destructive Migration
- Backward Compatibility
- Incremental Architecture
- Separation of Responsibilities
- UI Stability

---

# Documentation Dependencies

This document should remain consistent with:

```text
ARCHITECTURE.md

COMPONENTS.md

DEVELOPMENT.md

ARTIFACTS.md

README.md
```

When one document changes, related documents should be reviewed.

---

# Document Ownership

This document belongs to the overall architecture of Mirza.

Changes should be made whenever:

- A new domain entity is introduced.
- Relationships change.
- Synchronization behavior changes.
- Repository responsibilities change.
- Database schema changes.
- Storage technology changes.
- Migration behavior changes.
- Authentication architecture changes.

---

# Review Checklist

Before implementing any persistence-related feature, verify:

- Does it follow the domain model?
- Does it preserve Local First behavior?
- Does it remain compatible with the Repository pattern?
- Does it avoid breaking the current UI?
- Does it support future synchronization?
- Does it preserve backward compatibility?
- Does it require updates to this document?

If any answer is "No", the implementation should be reviewed before merging.

---

# Revision History

## Version 1.0

Initial architecture documentation.

Includes:

- Domain entities
- Entity relationships
- Repository architecture
- Synchronization model
- Migration strategy
- SQLite mapping
- PostgreSQL mapping
- Future expansion guidelines

Prepared for the first backend implementation.

---

## Future Revisions

Future revisions should record:

- Version number
- Date
- Summary of changes
- Breaking changes
- Migration requirements

This history helps maintain long-term architectural consistency.

---

# End of Document