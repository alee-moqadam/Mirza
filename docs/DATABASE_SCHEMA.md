# Database Schema

## Overview

This document defines the first planned database schema for Mirza before real SQLite CRUD is implemented.

`docs/DATA_MODEL.md` is the source of truth for entity design. This schema translates that model into SQLite-friendly tables while keeping future PostgreSQL and Prisma compatibility in mind.

Mirza remains local-first and offline-first. The current app must continue using localStorage through the repository/fallback path until an explicit, safe migration step is implemented.

## Schema Goals

- Support offline local usage without requiring a backend.
- Use SQLite as the first local database target.
- Keep future PostgreSQL/Prisma compatibility possible.
- Preserve existing UI behavior through repository/adapters.
- Avoid deleting, overwriting, or replacing existing localStorage data.
- Support future sync with stable local IDs, nullable server IDs, soft deletes, and versioning.
- Allow gradual migration through JSON payload columns where the current UI model is still evolving.

## Naming Conventions

- Table names use `snake_case` plural names.
- Column names use `snake_case`.
- Local primary keys use `local_id`.
- Future backend identifiers use nullable `server_id`.
- Foreign keys reference `local_id` unless otherwise noted.
- ISO timestamps are stored as `TEXT`.
- JSON payloads are stored as `TEXT`.
- Boolean values are stored as `INTEGER` using `0` or `1`.

## Common Columns

Most domain tables should include:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | Primary key generated on device. |
| `server_id` | `TEXT` | No | Future backend ID. Unique when present. |
| `user_id` | `TEXT` | No | Future owner ID. Nullable for local-only usage. |
| `device_id` | `TEXT` | No | Device that created or last changed the row. |
| `payload` | `TEXT` | No | JSON stored as text for gradual migration. |
| `created_at` | `TEXT` | Yes | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Soft delete timestamp. |

## Sync Columns

Syncable tables should include:

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `sync_status` | `TEXT` | Yes | `local`, `pending`, `synced`, `failed`, `deleted`, or `conflict`. |
| `last_synced_at` | `TEXT` | No | ISO timestamp for last successful sync. |
| `version` | `INTEGER` | Yes | Local optimistic version. Starts at `1`. |

## Tables

## records

### Purpose

Stores financial movements and events that appear in transaction history, including income, expenses, transfers, opening balances, loan payments, and check operations.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `type` | `TEXT` | Yes | No | `income`, `expense`, `transfer`, `openingBalance`, `loanPayment`, `checkOperation`. |
| `title` | `TEXT` | Yes | No | Display title. |
| `amount` | `REAL` | Yes | No | Positive numeric amount. |
| `date` | `TEXT` | Yes | No | ISO date or timestamp. |
| `direction` | `TEXT` | No | Yes | `inflow` or `outflow`. |
| `status` | `TEXT` | No | Yes | UI/domain status. |
| `category_id` | `TEXT` | No | Yes | FK to `categories.local_id`. |
| `bank_account_id` | `TEXT` | No | Yes | FK to `bank_accounts.local_id`. |
| `contact_id` | `TEXT` | No | Yes | FK to `financial_contacts.local_id`. |
| `loan_id` | `TEXT` | No | Yes | FK to `loans.local_id`. |
| `installment_id` | `TEXT` | No | Yes | FK to `installments.local_id`. |
| `check_id` | `TEXT` | No | Yes | FK to `checks.local_id`. |
| `transfer_group_id` | `TEXT` | No | Yes | Links two transfer records. |
| `notes` | `TEXT` | No | Yes | Free text notes. |
| `payload` | `TEXT` | No | Yes | JSON for current UI compatibility and gradual migration. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `category_id` -> `categories.local_id`
- `bank_account_id` -> `bank_accounts.local_id`
- `contact_id` -> `financial_contacts.local_id`
- `loan_id` -> `loans.local_id`
- `installment_id` -> `installments.local_id`
- `check_id` -> `checks.local_id`

### Indexes

- `idx_records_server_id`
- `idx_records_date`
- `idx_records_type`
- `idx_records_category_id`
- `idx_records_bank_account_id`
- `idx_records_transfer_group_id`
- `idx_records_sync_status`
- `idx_records_deleted_at`

### Notes

Loan payments should be linked records. Check operations should generate linked records when appropriate.

## loans

### Purpose

Stores loan agreements as separate entities with their own lifecycle.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `title` | `TEXT` | Yes | No | Loan title. |
| `contact_id` | `TEXT` | No | Yes | FK to `financial_contacts.local_id`. |
| `principal_amount` | `REAL` | Yes | No | Original amount. |
| `remaining_amount` | `REAL` | No | Yes | Remaining amount. |
| `interest_rate` | `REAL` | No | Yes | Optional rate. |
| `start_date` | `TEXT` | No | Yes | ISO date. |
| `end_date` | `TEXT` | No | Yes | ISO date. |
| `direction` | `TEXT` | Yes | No | `receivable` or `payable`. |
| `status` | `TEXT` | Yes | No | `active`, `paid`, `overdue`, `cancelled`. |
| `notes` | `TEXT` | No | Yes | Free text notes. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `contact_id` -> `financial_contacts.local_id`

### Indexes

- `idx_loans_server_id`
- `idx_loans_contact_id`
- `idx_loans_status`
- `idx_loans_sync_status`
- `idx_loans_deleted_at`

### Notes

Loans are separate entities. Loan payments should be represented through linked rows in `records`.

## installments

### Purpose

Stores scheduled child payments for loans.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `loan_id` | `TEXT` | Yes | No | FK to `loans.local_id`. |
| `due_date` | `TEXT` | Yes | No | ISO date. |
| `amount` | `REAL` | Yes | No | Scheduled amount. |
| `paid_amount` | `REAL` | No | Yes | Paid amount. |
| `payment_record_id` | `TEXT` | No | Yes | FK to `records.local_id`. |
| `status` | `TEXT` | Yes | No | `pending`, `partial`, `paid`, `overdue`, `cancelled`. |
| `paid_at` | `TEXT` | No | Yes | ISO timestamp. |
| `notes` | `TEXT` | No | Yes | Free text notes. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `loan_id` -> `loans.local_id`
- `payment_record_id` -> `records.local_id`

### Indexes

- `idx_installments_server_id`
- `idx_installments_loan_id`
- `idx_installments_due_date`
- `idx_installments_status`
- `idx_installments_sync_status`
- `idx_installments_deleted_at`

### Notes

Installments are child entities of Loan and should not duplicate the full loan data.

## checks

### Purpose

Stores check lifecycle data independently from transaction history.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `check_number` | `TEXT` | No | Yes | Bank check number. |
| `bank_account_id` | `TEXT` | No | Yes | FK to `bank_accounts.local_id`. |
| `contact_id` | `TEXT` | No | Yes | FK to `financial_contacts.local_id`. |
| `amount` | `REAL` | Yes | No | Check amount. |
| `issue_date` | `TEXT` | No | Yes | ISO date. |
| `due_date` | `TEXT` | Yes | No | ISO date. |
| `direction` | `TEXT` | Yes | No | `receivable` or `payable`. |
| `status` | `TEXT` | Yes | No | `issued`, `received`, `deposited`, `cleared`, `bounced`, `cancelled`. |
| `notes` | `TEXT` | No | Yes | Free text notes. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload, including legacy linked IDs if needed. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `bank_account_id` -> `bank_accounts.local_id`
- `contact_id` -> `financial_contacts.local_id`

### Indexes

- `idx_checks_server_id`
- `idx_checks_due_date`
- `idx_checks_status`
- `idx_checks_bank_account_id`
- `idx_checks_contact_id`
- `idx_checks_sync_status`
- `idx_checks_deleted_at`

### Notes

Checks are separate entities. Related money movements should be stored as linked `records` when appropriate.

## financial_contacts

### Purpose

Stores people, businesses, or organizations involved in financial activity.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `title` | `TEXT` | Yes | No | Display name. |
| `relation_title` | `TEXT` | No | Yes | Relationship label. |
| `mobile` | `TEXT` | No | Yes | Mobile number. |
| `phone` | `TEXT` | No | Yes | Phone number. |
| `email` | `TEXT` | No | Yes | Email. |
| `address` | `TEXT` | No | Yes | Address. |
| `notes` | `TEXT` | No | Yes | Free text notes. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- None initially.

### Indexes

- `idx_financial_contacts_server_id`
- `idx_financial_contacts_title`
- `idx_financial_contacts_mobile`
- `idx_financial_contacts_sync_status`
- `idx_financial_contacts_deleted_at`

### Notes

Contacts may be linked to records, loans, checks, and bank accounts.

## banks

### Purpose

Stores financial institution definitions.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `title` | `TEXT` | Yes | No | Bank name. |
| `code` | `TEXT` | No | Yes | Optional bank code. |
| `icon` | `TEXT` | No | Yes | Icon key/path. |
| `display_order` | `INTEGER` | No | Yes | Sort order. |
| `is_active` | `INTEGER` | Yes | No | Boolean as 0/1. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- None initially.

### Indexes

- `idx_banks_server_id`
- `idx_banks_title`
- `idx_banks_is_active`
- `idx_banks_sync_status`
- `idx_banks_deleted_at`

### Notes

Bank is not the same as BankAccount.

## bank_accounts

### Purpose

Stores actual accounts, cards, wallets, cash accounts, or payment sources.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_id` | `TEXT` | No | Yes | Future device reference. |
| `bank_id` | `TEXT` | No | Yes | FK to `banks.local_id`. |
| `owner_contact_id` | `TEXT` | No | Yes | FK to `financial_contacts.local_id`. |
| `title` | `TEXT` | Yes | No | Account/card display title. |
| `account_number` | `TEXT` | No | Yes | Account number. |
| `card_number` | `TEXT` | No | Yes | Card number. |
| `iban` | `TEXT` | No | Yes | IBAN. |
| `type` | `TEXT` | Yes | No | `bankAccount`, `card`, `cash`, `wallet`. |
| `currency` | `TEXT` | No | Yes | Currency code. |
| `opening_balance` | `REAL` | No | Yes | Prefer opening balance record for actual balance history. |
| `current_balance` | `REAL` | No | Yes | Optional cached balance. |
| `is_active` | `INTEGER` | Yes | No | Boolean as 0/1. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `bank_id` -> `banks.local_id`
- `owner_contact_id` -> `financial_contacts.local_id`

### Indexes

- `idx_bank_accounts_server_id`
- `idx_bank_accounts_bank_id`
- `idx_bank_accounts_owner_contact_id`
- `idx_bank_accounts_type`
- `idx_bank_accounts_is_active`
- `idx_bank_accounts_sync_status`
- `idx_bank_accounts_deleted_at`

### Notes

Bank and BankAccount are separate entities. Balance calculations should be derived from records where possible.

## categories

### Purpose

Stores classifications for records.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner for user-created categories. |
| `title` | `TEXT` | Yes | No | Display title. |
| `type` | `TEXT` | Yes | No | `income`, `expense`, `transfer`. |
| `parent_id` | `TEXT` | No | Yes | Self-reference to `categories.local_id`. |
| `is_system` | `INTEGER` | Yes | No | Boolean as 0/1. |
| `display_order` | `INTEGER` | No | Yes | Sort order. |
| `is_active` | `INTEGER` | Yes | No | Boolean as 0/1. |
| `payload` | `TEXT` | No | Yes | JSON compatibility payload. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- `parent_id` -> `categories.local_id`

### Indexes

- `idx_categories_server_id`
- `idx_categories_type`
- `idx_categories_parent_id`
- `idx_categories_is_active`
- `idx_categories_sync_status`
- `idx_categories_deleted_at`

### Notes

System defaults and user-created categories can share the table.

## settings

### Purpose

Stores app settings and preference bundles.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `key` | `TEXT` | Yes | No | Settings namespace/key. |
| `value` | `TEXT` | Yes | No | JSON stored as text. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |
| `sync_status` | `TEXT` | Yes | No | Sync state. |
| `last_synced_at` | `TEXT` | No | Yes | Last successful sync. |
| `version` | `INTEGER` | Yes | No | Optimistic version. |

### Primary Key

- `local_id`

### Foreign Keys

- None initially.

### Indexes

- `idx_settings_server_id`
- `idx_settings_key`
- `idx_settings_user_id`
- `idx_settings_sync_status`

### Notes

Settings should preserve current notification and lock settings during migration.

## devices

### Purpose

Stores device identity for future scheduled sync and multi-device support.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `server_id` | `TEXT` | No | Yes | Future backend ID. |
| `user_id` | `TEXT` | No | Yes | Future owner. |
| `device_name` | `TEXT` | No | Yes | User/device label. |
| `platform` | `TEXT` | No | Yes | `android`, `ios`, `web`, etc. |
| `app_version` | `TEXT` | No | Yes | App version at registration/update. |
| `last_sync_at` | `TEXT` | No | Yes | Last successful sync checkpoint time. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `deleted_at` | `TEXT` | No | Yes | Soft delete. |

### Primary Key

- `local_id`

### Foreign Keys

- None initially. Future `user_id` may reference backend users.

### Indexes

- `idx_devices_server_id`
- `idx_devices_user_id`
- `idx_devices_last_sync_at`

### Notes

Local-only usage must not require a device row to exist.

## sync_queue

### Purpose

Stores local changes waiting for future backend synchronization.

### Columns

| Column | Type | Required | Nullable | Notes |
| --- | --- | --- | --- | --- |
| `local_id` | `TEXT` | Yes | No | Primary key. |
| `entity_type` | `TEXT` | Yes | No | Table/entity name. |
| `entity_local_id` | `TEXT` | No | Yes | Local entity ID. |
| `entity_server_id` | `TEXT` | No | Yes | Server entity ID when known. |
| `operation` | `TEXT` | Yes | No | `create`, `update`, `delete`. |
| `payload` | `TEXT` | No | Yes | JSON payload snapshot. |
| `status` | `TEXT` | Yes | No | `pending`, `synced`, `failed`, `deleted`. |
| `attempts` | `INTEGER` | Yes | No | Retry count. |
| `last_error` | `TEXT` | No | Yes | Last sync error. |
| `created_at` | `TEXT` | Yes | No | ISO timestamp. |
| `updated_at` | `TEXT` | Yes | No | ISO timestamp. |
| `processed_at` | `TEXT` | No | Yes | Last processing timestamp. |

### Primary Key

- `local_id`

### Foreign Keys

- No hard foreign keys initially. Queue items may reference multiple tables through `entity_type`.

### Indexes

- `idx_sync_queue_status`
- `idx_sync_queue_entity`
- `idx_sync_queue_created_at`
- `idx_sync_queue_processed_at`

### Notes

Queue processing must be idempotent. A retry must not duplicate server-side records.

## Transfer Design

Transfers should be represented as two linked `records` rows:

- Outflow record from the source BankAccount.
- Inflow record to the destination BankAccount.

Both records share the same `transfer_group_id`.

This design keeps account balances auditable and avoids hidden balance changes.

## Opening Balance

Opening balance should be represented as a `records` row with:

- `type = openingBalance`
- `bank_account_id` set to the target account.
- `amount` set to the starting balance.
- `direction` set according to the balance effect.

`bank_accounts.opening_balance` may exist as compatibility/cache data, but the historical source of truth should be the opening balance record.

## Payload JSON Strategy

The schema includes `payload TEXT` on major domain tables to support gradual migration.

Payload usage:

- Preserve current UI fields that are not fully normalized yet.
- Store legacy localStorage shapes during early migration.
- Avoid schema churn while the repository/adapters stabilize.
- Keep data readable as JSON stored in text.

Payload should not become the only long-term data model. Frequently queried fields should be promoted to first-class columns.

## Migration from localStorage

Migration must be explicit, idempotent, and non-destructive.

Rules:

- Do not delete localStorage data.
- Do not overwrite existing real user data.
- Keep localStorage as fallback and migration source.
- Generate `local_id` values safely for migrated rows.
- Preserve legacy IDs in payload where useful.
- Add sync columns with safe defaults.
- Run migration only after a migration flag/status check.
- Keep repository/adapters responsible for UI compatibility.

No SQL migration file is defined yet.

## Prisma/PostgreSQL Compatibility Notes

- `TEXT` maps cleanly to PostgreSQL `text` or Prisma `String`.
- `REAL` may become PostgreSQL `numeric` for money precision.
- `INTEGER` booleans may become Prisma `Boolean` and PostgreSQL `boolean`.
- JSON stored as `TEXT` in SQLite may become PostgreSQL `jsonb`.
- `local_id` and `server_id` should remain distinct even when backend IDs exist.
- Soft delete via `deleted_at` should remain consistent across SQLite and PostgreSQL.
- Index names should remain stable and descriptive.
- Foreign keys should be introduced carefully if migration data can contain legacy inconsistencies.

## Open Decisions

- Exact SQL migration file format.
- Whether money amounts should remain `REAL` in SQLite or use integer minor units.
- Final enum values for record, loan, installment, and check statuses.
- Whether `server_id` should be globally unique or unique per table.
- Whether hard foreign keys should be enabled from the first SQLite migration.
- Final Prisma model names and relation names.
- Whether payload columns are retained long term or phased out after migration.
- How conflict records are stored when sync detects divergent local and server changes.
