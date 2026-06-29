# میرزا

پروژه کامل و قابل اجرای React + Vite برای میرزا، با رابط موبایل‌محور، RTL، تاریخ شمسی، تم روشن/تیره و ذخیره‌سازی کامل در `localStorage`.

## پیش‌نیاز

- Node.js نسخه 18 یا بالاتر
- npm

## اجرا

```bash
npm install
npm run dev
```

سپس آدرس زیر را باز کنید:

```text
http://localhost:5173/
```

## ساخت نسخه Production

```bash
npm run build
npm run preview
```

## ساختار کامل پروژه وب

```text
.
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── src
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── styles
    │   └── index.css
    ├── components
    │   ├── AmountDisplay.jsx
    │   ├── AmountInput.jsx
    │   ├── BottomNav.jsx
    │   ├── JalaliDateInput.jsx
    │   ├── RecordDetailSheet.jsx
    │   ├── UI.jsx
    │   ├── UndoSnackbar.jsx
    │   ├── records
    │   │   ├── RecordCard.jsx
    │   │   ├── RecordForm.jsx
    │   │   ├── RecordToolbar.jsx
    │   │   └── SpecialPayables.jsx
    │   └── settings
    │       ├── ContactCard.jsx
    │       └── SimpleManager.jsx
    ├── constants
    │   ├── records.js
    │   └── settings.js
    ├── data
    │   └── sampleData.js
    ├── helpers
    │   ├── calculations.js
    │   ├── contacts.js
    │   ├── currency.js
    │   ├── dates.js
    │   ├── formatters.js
    │   └── records.js
    ├── hooks
    │   ├── useFinanceData.js
    │   ├── useRecords.js
    │   ├── useSettings.js
    │   └── useUndoAction.js
    ├── i18n
    │   ├── I18nContext.jsx
    │   └── translations.js
    ├── pages
    │   ├── Dashboard.jsx
    │   ├── HistoryView.jsx
    │   ├── RecordsPage.jsx
    │   └── Settings.jsx
    ├── services
    │   └── localStorageService.js
    └── utils
        └── numberFormat.js
```

## وابستگی‌ها

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `lucide-react`
- `jalaali-js`

## محل منطق‌های اصلی

- ذخیره‌سازی localStorage: `src/services/localStorageService.js`
- داده‌های نمونه: `src/data/sampleData.js`
- محاسبات داشبورد: `src/helpers/calculations.js`
- تبدیل و محاسبات تاریخ شمسی: `src/helpers/dates.js`
- قالب‌بندی عدد و مبلغ: `src/helpers/formatters.js`
- ترجمه‌ها: `src/i18n/translations.js`
- مدیریت تم، پروفایل و تنظیمات: `src/pages/Settings.jsx`

پروژه برای اجرا به backend، دیتابیس آنلاین یا API پولی نیاز ندارد.
