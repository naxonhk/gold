'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: '🏠' },
  { href: '/prices', label: '金價', icon: '📊' },
  { href: '/records', label: '記錄', icon: '📒' },
  { href: '/calculator', label: '計算機', icon: '🧮' },
  { href: '/settings', label: '設置', icon: '⚙️' },
];

export default function Records() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newRecord, setNewRecord] = useState({ type: 'buy', weight: '', price: '', note: '' });
  
  const authRef = useRef(null);
  const dbRef = useRef(null);

  useEffect(() => {
    function initFirebase() {
      const check = setInterval(() => {
        if (window.firebase) {
          clearInterval(check);
          const app = window.firebase.initializeApp({ apiKey: "AIzaSyDTAQgCvZO7Q9Y9A2rSWf0HL1uyA0iJwj4", authDomain: "gold-6b24b.firebaseapp.com", projectId: "gold-6b24b", storageBucket: "gold-6b24b.firebasestorage.app", messagingSenderId: "1095159481868", appId: "1:1095159481868:web:af30df2ff4cc0427e05029" });
          authRef.current = window.firebase.auth(app);
          dbRef.current = window.firebase.firestore(app);
          
          authRef.current.onAuthStateChanged((u) => {
            setUser(u);
            setLoading(false);
            if (u) loadRecords(u.uid);
          });
        }
      }, 100);
    }
    initFirebase();
  }, []);

  const loadRecords = (uid) => {
    if (!dbRef.current) return;
    dbRef.current.collection('users').doc(uid).collection('records').orderBy('createdAt', 'desc')
      .onSnapshot((snap) => {
        setRecords(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || new Date() })));
      });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user || !newRecord.weight || !newRecord.price) return;
    await dbRef.current.collection('users').doc(user.uid).collection('records').add({
      ...newRecord,
      weight: parseFloat(newRecord.weight),
      price: parseFloat(newRecord.price),
      total: parseFloat(newRecord.weight) * parseFloat(newRecord.price),
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
    setNewRecord({ type: 'buy', weight: '', price: '', note: '' });
    setShowAdd(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('確定刪除？')) return;
    await dbRef.current.collection('users').doc(user.uid).collection('records').doc(id).delete();
  };

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);
  const totalValue = records.reduce((s, r) => s + (r.total || 0), 0);
  const totalWeight = records.reduce((s, r) => s + (r.weight || 0), 0);
  const buyRecords = records.filter(r => r.type === 'buy');
  const sellRecords = records.filter(r => r.type === 'sell');
  const totalBuy = buyRecords.reduce((s, r) => s + (r.total || 0), 0);
  const totalSell = sellRecords.reduce((s, r) => s + (r.total || 0), 0);
  const profit = totalSell - totalBuy;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ background: 'rgba(10,10,26,0.95)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700' }}>📒 我的記錄</span>
          {user && <button onClick={() => authRef.current.signOut()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>登出</button>}
        </div>
      </header>

      {!user ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔐</div>
          <h2 style={{ marginBottom: '12px' }}>登入查看記錄</h2>
          <p style={{ color: '#888', marginBottom: '24px' }}>登入後可記錄和管理您的黃金資產</p>
          <button onClick={() => setShowAuth(true)} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #ffd700, #daa520)', border: 'none', borderRadius: '12px', color: '#0a0a1a', fontWeight: 'bold', cursor: 'pointer' }}>立即登入</button>
          
          {showAuth && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setShowAuth(false)}>
              <div style={{ background: '#1a1a3e', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>登入</h3>
                <GoogleLogin auth={authRef.current} onSuccess={() => setShowAuth(false)} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <StatCard label="總價值" value={`HK$ ${totalValue.toLocaleString()}`} sub={`${totalWeight.toFixed(2)} 両`} />
              <StatCard label="總投入" value={`HK$ ${totalBuy.toLocaleString()}`} sub={`${buyRecords.length} 筆`} color="#ff5c5c" />
              <StatCard label="總回收" value={`HK$ ${totalSell.toLocaleString()}`} sub={`${sellRecords.length} 筆`} color="#00d68f" />
              <StatCard label="賬面損益" value={`${profit >= 0 ? '+' : ''}HK$ ${profit.toLocaleString()}`} sub={profit >= 0 ? '賺錢' : '虧錢'} color={profit >= 0 ? '#00d68f' : '#ff5c5c'} />
            </div>
          </div>

          {/* Add Button */}
          <div style={{ padding: '0 16px', maxWidth: '600px', margin: '0 auto' }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ffd700, #daa520)', border: 'none', borderRadius: '12px', color: '#0a0a1a', fontWeight: 'bold', cursor: 'pointer' }}>+ 新增記錄</button>
          </div>

          {/* Add Form */}
          {showAdd && (
            <div style={{ padding: '16px', maxWidth: '600px', margin: '12px auto 0', background: 'rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <form onSubmit={handleAdd}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <select value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value})} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}>
                    <option value="buy">買入</option>
                    <option value="sell">賣出</option>
                  </select>
                  <input type="number" placeholder="重量（両）" value={newRecord.weight} onChange={e => setNewRecord({...newRecord, weight: e.target.value})} style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} required />
                  <input type="number" placeholder="單價（HK$）" value={newRecord.price} onChange={e => setNewRecord({...newRecord, price: e.target.value})} style={{ gridColumn: 'span 2', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} required />
                  <input type="text" placeholder="備註（選填）" value={newRecord.note} onChange={e => setNewRecord({...newRecord, note: e.target.value})} style={{ gridColumn: 'span 2', padding: '12px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }} />
                  <button type="submit" style={{ gridColumn: 'span 2', padding: '14px', background: '#ffd700', border: 'none', borderRadius: '8px', color: '#0a0a1a', fontWeight: 'bold', cursor: 'pointer' }}>儲存</button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '10px', overflowX: 'auto' }}>
            {['all', 'buy', 'sell'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '10px 16px', background: filter === f ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${filter === f ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: '20px', color: filter === f ? '#ffd700' : '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {f === 'all' ? '全部' : f === 'buy' ? '買入' : '賣出'} ({f === 'all' ? records.length : records.filter(r => r.type === f).length})
              </button>
            ))}
          </div>

          {/* Records List */}
          <div style={{ padding: '0 16px 16px', maxWidth: '600px', margin: '0 auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>暫無記錄</div>
            ) : (
              filtered.map(record => (
                <div key={record.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: record.type === 'buy' ? 'rgba(0,214,143,0.2)' : 'rgba(255,92,92,0.2)', color: record.type === 'buy' ? '#00d68f' : '#ff5c5c' }}>
                      {record.type === 'buy' ? '買入' : '賣出'}
                    </span>
                    <div style={{ marginTop: '8px', color: '#888', fontSize: '14px' }}>
                      {record.weight} 両 × HK$ {record.price?.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700' }}>HK$ {record.total?.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{record.createdAt?.toLocaleDateString?.('zh-HK') || '今天'}</div>
                    <button onClick={() => handleDelete(record.id)} style={{ marginTop: '8px', background: 'rgba(255,92,92,0.2)', border: 'none', borderRadius: '6px', color: '#ff5c5c', padding: '4px 12px', cursor: 'pointer', fontSize: '12px' }}>刪除</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

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

function StatCard({ label, value, sub, color = '#ffd700' }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>{sub}</div>
    </div>
  );
}

function GoogleLogin({ auth, onSuccess }) {
  const handleLogin = async () => {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
      onSuccess();
    } catch (e) { alert(e.message); }
  };
  return (
    <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: '#fff', border: 'none', borderRadius: '8px', color: '#333', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      使用 Google 登入
    </button>
  );
}
