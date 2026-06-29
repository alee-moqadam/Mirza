# مدیریت مالی شخصی - Android Native

این پروژه مستقل از وب‌اپ است و با Android Views نیتیو و Java ساخته شده است.

## ذخیره‌سازی

- پایگاه داده: SQLite داخلی با `SQLiteOpenHelper`
- مسیر دیتابیس در فضای خصوصی اپ Android
- بدون WebView، Capacitor، Cordova یا سرویس آنلاین
- بدون مجوز اینترنت
- پاک‌شدن داده‌ها فقط با پاک‌کردن داده اپ یا حذف برنامه

## ساخت APK

```bash
export JAVA_HOME="../.android-toolchain/jdk/Contents/Home"
export ANDROID_HOME="../.android-toolchain/sdk"
./gradlew assembleDebug
```

خروجی در `app/build/outputs/apk/debug/app-debug.apk` قرار می‌گیرد.
