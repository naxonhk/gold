import './globals.css';
import PWAProvider from './components/PWAProvider';

export const metadata = {
  title: '貴金屬管家 - 您的黃金資產管理專家',
  description: '首創將金額自動換算為黃金克重，讓您輕鬆管理貴金屬資產。即時查詢金價、記錄資產、計算收益。支援周大福、周生生即時金價。',
  keywords: '黃金、白銀、鉑金、金價、資產管理、周大福金價、周生生金價',
  openGraph: {
    title: '貴金屬管家 - 您的黃金資產管理專家',
    description: '首創將金額自動換算為黃金克重，讓您輕鬆管理貴金屬資產',
    type: 'website',
    locale: 'zh_HK',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-HK">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="貴金屬管家" />
        <meta name="theme-color" content="#0a0a1a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <title>貴金屬管家</title>
        {/* Firebase CDN */}
        <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
        <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
      </head>
      <body>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
