'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/prices', label: '金價', icon: '📊' },
  { href: '/records', label: '記錄', icon: '📒' },
  { href: '/calculator', label: '計算機', icon: '🧮' },
  { href: '/settings', label: '設置', icon: '⚙️' },
];

export default function Prices() {
  const pathname = usePathname();
  const [selectedSource, setSelectedSource] = useState('chowtaifook');
  const [prices, setPrices] = useState(null);
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

  if (!prices) return <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>載入中...</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ background: 'rgba(10,10,26,0.95)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700' }}>📊 今日金價</span>
          <button onClick={fetchPrices} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>{loading ? '🔄' : '🔄'}</button>
        </div>
      </header>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => setSelectedSource('chowtaifook')} style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', background: selectedSource === 'chowtaifook' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', color: selectedSource === 'chowtaifook' ? '#ffd700' : '#888', fontWeight: '600' }}>
            🏪 周大福
          </button>
          <button onClick={() => setSelectedSource('chowsangsang')} style={{ flex: 1, padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', background: selectedSource === 'chowsangsang' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', color: selectedSource === 'chowsangsang' ? '#ffd700' : '#888', fontWeight: '600' }}>
            🏪 周生生
          </button>
        </div>

        {selectedSource === 'chowtaifook' ? (
          <>
            <PriceCard title="💎 999.9 黃金" data={prices.chowtaifook.gold999} />
            <PriceCard title="🪙 黃金粒 (投資黃金)" data={prices.chowtaifook.goldPellet} />
            <PriceCard title="🔄 黃金贖回價" data={prices.chowtaifook.goldRedemption} simple />
          </>
        ) : (
          <>
            <PriceCard title="💍 黃金飾品" data={prices.chowsangsang.goldOrnaments} exchange />
            <PriceCard title="📐 金條" data={prices.chowsangsang.goldIngot} />
            <PriceCard title="🪙 金粒" data={prices.chowsangsang.goldBars} />
          </>
        )}
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

function PriceCard({ title, data, simple, exchange }) {
  if (simple) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffd700', marginBottom: '12px' }}>{title}</div>
        <div style={{ background: 'rgba(255,92,92,0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>回收價</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff5c5c' }}>HK$ {data.buy.toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>毎克 HK$ {data.buyGram}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,215,0,0.15)' }}>
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffd700', marginBottom: '16px' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: exchange ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
        <PriceBox label="售價" value={data.sell} gram={data.sellGram} color="#00d68f" />
        {exchange && <PriceBox label="兌換" value={data.exchange} gram={data.exchangeGram} color="#5c9fff" />}
        <PriceBox label="回收" value={data.buy} gram={data.buyGram} color="#ff5c5c" />
      </div>
    </div>
  );
}

function PriceBox({ label, value, gram, color }) {
  return (
    <div style={{ background: `${color}15`, padding: '14px', borderRadius: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>HK$ {value?.toLocaleString()}</div>
      <div style={{ fontSize: '11px', color: '#888' }}>毎克 HK$ {gram}</div>
    </div>
  );
}
