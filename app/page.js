'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_PRICES, PRICE_HISTORY } from '@/lib/prices';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/prices', label: '金價', icon: '📊' },
  { href: '/records', label: '記錄', icon: '📒' },
  { href: '/calculator', label: '計算機', icon: '🧮' },
  { href: '/settings', label: '設置', icon: '⚙️' },
];

export default function Home() {
  const pathname = usePathname();
  const [selectedSource, setSelectedSource] = useState('chowtaifook');
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prices?t=' + Date.now());
      const data = await res.json();
      if (data.success) setPrices(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchPrices(); }, []);

  const currentPrices = prices[selectedSource];
  const historyData = PRICE_HISTORY[selectedSource];

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ background: 'rgba(10,10,26,0.95)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🏆</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(45deg,#ffd700,#daa520)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>貴金屬管家</span>
          </div>
          <Link href="/settings" style={{ color: '#ffd700', textDecoration: 'none' }}>登入</Link>
        </div>
      </header>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setSelectedSource('chowtaifook')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: selectedSource === 'chowtaifook' ? 'rgba(255,215,0,0.2)' : 'transparent', color: selectedSource === 'chowtaifook' ? '#ffd700' : '#888', fontWeight: '600' }}>
            🏪 周大福
          </button>
          <button onClick={() => setSelectedSource('chowsangsang')} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: selectedSource === 'chowsangsang' ? 'rgba(255,215,0,0.2)' : 'transparent', color: selectedSource === 'chowsangsang' ? '#ffd700' : '#888', fontWeight: '600' }}>
            🏪 周生生
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', maxWidth: '600px', margin: '0 auto' }}>
        {selectedSource === 'chowtaifook' ? (
          <>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700' }}>💎 999.9 黃金</span>
                <button onClick={fetchPrices} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{loading ? '🔄' : '🔄'}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(0,214,143,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>售價 Sell</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d68f' }}>HK$ {currentPrices.gold999.sell.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>毎克 HK$ {currentPrices.gold999.sellGram}</div>
                </div>
                <div style={{ background: 'rgba(255,92,92,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>回收價 Buy</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5c5c' }}>HK$ {currentPrices.gold999.buy.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>毎克 HK$ {currentPrices.gold999.buyGram}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700', marginBottom: '16px' }}>🪙 黃金粒 (投資黃金)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(0,214,143,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>售價 Sell</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d68f' }}>HK$ {currentPrices.goldPellet.sell.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>毎克 HK$ {currentPrices.goldPellet.sellGram}</div>
                </div>
                <div style={{ background: 'rgba(255,92,92,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>回收價 Buy</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5c5c' }}>HK$ {currentPrices.goldPellet.buy.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>毎克 HK$ {currentPrices.goldPellet.buyGram}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,215,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700' }}>💍 黃金飾品</span>
                <button onClick={fetchPrices} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>{loading ? '🔄' : '🔄'}</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(0,214,143,0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>售價</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00d68f' }}>${currentPrices.goldOrnaments.sell.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(92,159,255,0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>兌換</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#5c9fff' }}>${currentPrices.goldOrnaments.exchange.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,92,92,0.1)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#888' }}>回收</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff5c5c' }}>${currentPrices.goldOrnaments.buy.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,215,0,0.15)' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700', marginBottom: '16px' }}>📐 金條 / 金粒</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(0,214,143,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>金條售價</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#00d68f' }}>HK$ {currentPrices.goldIngot.sell.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,92,92,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>金粒售價</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff5c5c' }}>HK$ {currentPrices.goldBars.sell.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffd700' }}>📈 一週金價趨勢</span>
            <span style={{ fontSize: '12px', color: '#888' }}>999.9 Gold</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '120px', gap: '8px' }}>
            {PRICE_HISTORY.labels.map((label, i) => {
              const value = historyData.gold999[i];
              const max = Math.max(...historyData.gold999);
              const min = Math.min(...historyData.gold999);
              const height = ((value - min) / (max - min)) * 80 + 20;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '100%', background: 'rgba(255,215,0,0.2)', borderRadius: '6px', height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ width: '70%', background: 'linear-gradient(180deg, #ffd700, #daa520)', borderRadius: '6px', height: `${height}px` }}></div>
                  </div>
                  <span style={{ fontSize: '10px', color: '#888' }}>${(value/1000).toFixed(1)}k</span>
                  <span style={{ fontSize: '10px', color: '#666' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <Link href="/records" style={{ display: 'block', padding: '16px', background: 'linear-gradient(135deg, #ffd700, #daa520)', color: '#0a0a1a', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          開始記錄我的黃金資產 →
        </Link>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,10,26,0.98)', borderTop: '1px solid rgba(255,215,0,0.2)', padding: '8px 16px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: pathname === item.href ? '#ffd700' : '#666', fontSize: '10px' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
