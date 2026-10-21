# دفتر من - نسخه اندروید (آفلاین)

همه چیز (React، فونت وزیرمتن، کد برنامه) داخل APK بسته‌بندی می‌شود و برنامه بدون اینترنت کار می‌کند.
داده‌ها در حافظه خود WebView ذخیره می‌شوند و با بستن برنامه پاک نمی‌شوند.

## روش ۱: ساخت APK در GitHub (بدون نصب اندروید استودیو)
1. این پوشه را در یک مخزن جدید GitHub آپلود کنید (شاخه main).
2. تب Actions ← Build APK ← Run workflow.
3. بعد از چند دقیقه از بخش Artifacts فایل daftar-man-apk را دانلود کنید، zip را باز کنید و app-debug.apk را روی گوشی نصب کنید (نصب از منابع ناشناس را مجاز کنید).

## روش ۲: ساخت روی کامپیوتر خودتان
نیازمند Node 18+، JDK 17 و Android SDK (یا Android Studio):

    npm install
    npm run build
    npx cap add android
    npx cap sync android
    cd android && ./gradlew assembleDebug

خروجی: android/app/build/outputs/apk/debug/app-debug.apk
