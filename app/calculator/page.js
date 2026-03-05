'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEFAULT_PRICES } from '@/lib/prices';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/prices', label: '金價', icon: '📊' },
  { href: '/records', label: '記錄', icon: '📒' },
  { href: '/calculator', label: '計算機', icon: '🧮' },
  { href: '/settings', label: '設置', icon: '⚙️' },
];

export default function Calculator() {
  const pathname = usePathname();
  const [source, setSource] = useState('chowtaifook');
  const [goldType, setGoldType] = useState('gold999');
  const [weight, setWeight] = useState('');
  const [unit, setUnit] = useState('tael');
  const [priceType, setPriceType] = useState('sell');
  const [result, setResult] = useState(null);

  const prices = DEFAULT_PRICES[source];

  const goldTypes = source === 'chowtaifook' 
    ? [{ value: 'gold999', label: '💎 999.9 黃金' }, { value: 'goldPellet', label: '🪙 黃金粒' }]
    : [{ value: 'goldOrnaments', label: '💍 黃金飾品' }, { value: 'goldIngot', label: '📐 金條' }, { value: 'goldBars', label: '🪙 金粒' }];

  const calculate = () => {
    if (!weight) return;
    const pricePerTael = prices[goldType][priceType];
    const weightInTael = unit === 'gram' ? parseFloat(weight) / 37.429 : parseFloat(weight);
    const total = weightInTael * pricePerTael;
    const gram = weightInTael * 37.429;
    setResult({ total, gram, weightInTael, pricePerTael });
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ background: 'rgba(10,10,26,0.95)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700' }}>🧮 黃金計算機</span>
        </div>
      </header>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {/* Source Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>選擇金店</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { setSource('chowtaifook'); setGoldType('gold999'); }} style={{ flex: 1, padding: '12px', background: source === 'chowtaifook' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${source === 'chowtaifook' ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: source === 'chowtaifook' ? '#ffd700' : '#888', cursor: 'pointer' }}>🏪 周大福</button>
            <button onClick={() => { setSource('chowsangsang'); setGoldType('goldOrnaments'); }} style={{ flex: 1, padding: '12px', background: source === 'chowsangsang' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${source === 'chowsangsang' ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: source === 'chowsangsang' ? '#ffd700' : '#888', cursor: 'pointer' }}>🏪 周生生</button>
          </div>
        </div>

        {/* Gold Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>黃金類型</label>
          <select value={goldType} onChange={e => setGoldType(e.target.value)} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '16px' }}>
            {goldTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Weight */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>重量</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="輸入重量" style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '16px' }} />
            <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100px', padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', fontSize: '16px' }}>
              <option value="tael">両</option>
              <option value="gram">克</option>
            </select>
          </div>
        </div>

        {/* Price Type */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '14px', marginBottom: '8px' }}>價格類型</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setPriceType('sell')} style={{ flex: 1, padding: '14px', background: priceType === 'sell' ? 'rgba(0,214,143,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${priceType === 'sell' ? '#00d68f' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: priceType === 'sell' ? '#00d68f' : '#888', cursor: 'pointer' }}>📈 售價</button>
            <button onClick={() => setPriceType('buy')} style={{ flex: 1, padding: '14px', background: priceType === 'buy' ? 'rgba(255,92,92,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${priceType === 'buy' ? '#ff5c5c' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: priceType === 'buy' ? '#ff5c5c' : '#888', cursor: 'pointer' }}>📉 回收價</button>
          </div>
        </div>

        {/* Calculate Button */}
        <button onClick={calculate} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ffd700, #daa520)', border: 'none', borderRadius: '12px', color: '#0a0a1a', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>計算</button>

        {/* Result */}
        {result && (
          <div style={{ marginTop: '24px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ color: '#888', marginBottom: '8px' }}>估計價值</div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd700', marginBottom: '8px' }}>HK$ {result.total.toLocaleString()}</div>
            <div style={{ color: '#888', fontSize: '14px' }}>
              {result.weightInTael.toFixed(3)} 両 | {result.gram.toFixed(2)} 克
            </div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              (單價: HK$ {result.pricePerTael.toLocaleString()}/両)
            </div>
          </div>
        )}

        {/* Current Price Reference */}
        <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>📊 參考價格</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(0,214,143,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>售價</div>
              <div style={{ fontWeight: 'bold', color: '#00d68f' }}>HK$ {prices[goldType].sell?.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,92,92,0.1)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>回收價</div>
              <div style={{ fontWeight: 'bold', color: '#ff5c5c' }}>HK$ {prices[goldType].buy?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(10,10,26,0.98)', borderTop: '1px solid rgba(255,215,0,0.2)', padding: '8px 16px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: pathname === item.href ? '#ffd700' : '#666', fontSize: '10px' }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
