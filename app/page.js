'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [prices, setPrices] = useState({
    chowtaifook: { gold999: { sell: null, buy: null }, goldPellet: { sell: null, buy: null } },
    chowsangsang: { goldOrnaments: { sell: null, buy: null }, goldIngot: { sell: null, buy: null }, goldBars: { sell: null, buy: null } }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState('chowtaifook');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchPrices = async (force = false) => {
    try {
      const response = await fetch(`/api/prices?force=${force}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setPrices(result.data);
        setLastUpdate(result.lastUpdate);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // 每 5 分鐘自動刷新
    const interval = setInterval(() => fetchPrices(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrices(true);
  };

  return (
    <main>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo">
              <span className="logo-icon">🏆</span>
              <span className="logo-text">貴金屬管家</span>
            </Link>
            
            <nav className="nav">
              <Link href="/" className="nav-link active">首頁</Link>
              <Link href="/dashboard" className="nav-link">我的資產</Link>
            </nav>
            
            <div className="user-section">
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                開始使用
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            貴金屬<span>管家</span>
          </h1>
          <p className="hero-subtitle">
            看著保險櫃那一堆金銀財寶卻不知道它們價值多少，究竟是賺了還是虧了。
            首創將金額自動換算為黃金克重，讓您輕鬆管理貴金屬資產。
          </p>
          <div className="hero-buttons">
            <Link href="/dashboard" className="btn btn-primary">
              立即開始
            </Link>
            <a href="#prices" className="btn btn-secondary">
              查看金價
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">核心功能</h2>
          <p className="section-subtitle">全方位管理您的黃金白銀投資</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">實時金價</h3>
              <p className="feature-desc">連接周大福、周生生官網，即時獲取最新金價</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📒</div>
              <h3 className="feature-title">攢金記賬</h3>
              <p className="feature-desc">記錄買入賣出，自動計算資產價值與損益</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🧮</div>
              <h3 className="feature-title">黃金計算機</h3>
              <p className="feature-desc">輸入重量即時計算價值，支援両與克換算</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">手機專用</h3>
              <p className="feature-desc">響應式設計，完美支援手機平板電腦</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3 className="feature-title">價格提醒</h3>
              <p className="feature-desc">自訂價格通知，市場波動即時知曉</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3 className="feature-title">數據安全</h3>
              <p className="feature-desc">雲端儲存，您的數據永不丟失</p>
            </div>
          </div>
        </div>
      </section>

      {/* Price Section */}
      <section id="prices" className="price-section">
        <div className="container">
          <div className="price-header">
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>今日金價</h2>
            <button 
              onClick={handleRefresh} 
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
            >
              {refreshing ? '🔄 載入中' : '🔄 刷新'}
            </button>
          </div>
          
          <div className="price-source-tabs">
            <button 
              className={`price-tab ${selectedSource === 'chowtaifook' ? 'active' : ''}`}
              onClick={() => setSelectedSource('chowtaifook')}
            >
              🏪 周大福
            </button>
            <button 
              className={`price-tab ${selectedSource === 'chowsangsang' ? 'active' : ''}`}
              onClick={() => setSelectedSource('chowsangsang')}
            >
              🏪 周生生
            </button>
          </div>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="price-grid">
              {selectedSource === 'chowtaifook' ? (
                <>
                  <div className="price-card">
                    <h3 className="price-card-title">💰 999.9 黃金</h3>
                    <div className="price-row">
                      <span className="price-label">售價（毎両）</span>
                      <span className="price-value sell">HK$ {prices.chowtaifook.sell?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">回收價（毎両）</span>
                      <span className="price-value buy">HK$ {prices.chowtaifook.buy?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">售價（毎克）</span>
                      <span className="price-value sell">HK$ {prices.chowtaifook.sellGram?.toFixed(2) || '--'}</span>
                    </div>
                  </div>
                  
                  <div className="price-card">
                    <h3 className="price-card-title">🪙 黃金粒</h3>
                    <div className="price-row">
                      <span className="price-label">售價（毎両）</span>
                      <span className="price-value sell">HK$ {prices.chowtaifook.pelletSell?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">回收價（毎両）</span>
                      <span className="price-value buy">HK$ {prices.chowtaifook.pelletBuy?.toLocaleString() || '--'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="price-card">
                    <h3 className="price-card-title">💍 黃金飾品</h3>
                    <div className="price-row">
                      <span className="price-label">售價（毎両）</span>
                      <span className="price-value sell">HK$ {prices.chowsangsang.sell?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">兌換價（毎両）</span>
                      <span className="price-value exchange">HK$ {prices.chowsangsang.exchange?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">回收價（毎両）</span>
                      <span className="price-value buy">HK$ {prices.chowsangsang.buy?.toLocaleString() || '--'}</span>
                    </div>
                  </div>
                  
                  <div className="price-card">
                    <h3 className="price-card-title">📐 金條</h3>
                    <div className="price-row">
                      <span className="price-label">售價（毎両）</span>
                      <span className="price-value sell">HK$ {prices.chowsangsang.ingotSell?.toLocaleString() || '--'}</span>
                    </div>
                    <div className="price-row">
                      <span className="price-label">回收價（毎両）</span>
                      <span className="price-value buy">HK$ {prices.chowsangsang.ingotBuy?.toLocaleString() || '--'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="last-update">
            {lastUpdate ? `最後更新：${new Date(lastUpdate).toLocaleString('zh-HK')}` : '載入中...'}
            <br />
            <span style={{ color: 'var(--primary)', fontSize: '11px' }}>每 5 分鐘自動更新</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="section-title">開始記錄您的貴金屬資產</h2>
          <p className="section-subtitle">免費註冊，輕鬆管理您的黃金白銀投資</p>
          <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
            立即開始 →
          </Link>
        </div>
      </section>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <Link href="/" className="mobile-nav-item active">
          <span>🏠</span>
          <span>首頁</span>
        </Link>
        <Link href="/dashboard" className="mobile-nav-item">
          <span>💰</span>
          <span>資產</span>
        </Link>
      </nav>
    </main>
  );
}
