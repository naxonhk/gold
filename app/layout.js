import './globals.css';

export const metadata = {
  title: '貴金屬管家 - 您的黃金資產管理專家',
  description: '首創將金額自動換算為黃金克重，讓您輕鬆管理貴金屬資產。即時查詢金價、記錄資產、計算收益。支援周大福、周生生即時金價。',
  keywords: '黃金、白銀、鉑金、貴金屬、金價、資產管理、周大福金價、周生生金價',
  openGraph: {
    title: '貴金屬管家 - 您的黃金資產管理專家',
    description: '首創將金額自動換算為黃金克重，讓您輕鬆管理貴金屬資產',
    type: 'website',
    locale: 'zh_HK',
  },
  manifest: '/manifest.json',
  appleMobileWebAppCapable: 'yes',
  appleMobileWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-HK">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-title" content="貴金屬管家" />
      </head>
      <body>{children}</body>
    </html>
  );
}
