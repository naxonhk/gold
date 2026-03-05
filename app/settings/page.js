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

export default function Settings() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // User preferences
  const [preferredUnit, setPreferredUnit] = useState('tael');
  const [notifications, setNotifications] = useState(true);
  
  const authRef = useRef(null);

  useEffect(() => {
    function initFirebase() {
      const check = setInterval(() => {
        if (window.firebase) {
          clearInterval(check);
          const app = window.firebase.initializeApp({ apiKey: "AIzaSyDTAQgCvZO7Q9Y9A2rSWf0HL1uyA0iJwj4", authDomain: "gold-6b24b.firebaseapp.com", projectId: "gold-6b24b", storageBucket: "gold-6b24b.firebasestorage.app", messagingSenderId: "1095159481868", appId: "1:1095159481868:web:af30df2ff4cc0427e05029" });
          authRef.current = window.firebase.auth(app);
          
          // Load preferences from localStorage
          const savedUnit = localStorage.getItem('preferredUnit');
          if (savedUnit) setPreferredUnit(savedUnit);
          
          authRef.current.onAuthStateChanged((u) => {
            setUser(u);
            setLoading(false);
          });
        }
      }, 100);
    }
    initFirebase();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await authRef.current.signInWithEmailAndPassword(email, password);
      } else {
        await authRef.current.createUserWithEmailAndPassword(email, password);
      }
      setShowAuth(false);
      setEmail('');
      setPassword('');
    } catch (e) { setError(e.message); }
  };

  const handleGoogleLogin = async () => {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    try {
      await authRef.current.signInWithPopup(provider);
      setShowAuth(false);
    } catch (e) { setError(e.message); }
  };

  const handleLogout = () => authRef.current.signOut();

  const saveUnit = (unit) => {
    setPreferredUnit(unit);
    localStorage.setItem('preferredUnit', unit);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>載入中...</div>;

  return (
    <div style={{ paddingBottom: '80px' }}>
      <header style={{ background: 'rgba(10,10,26,0.95)', padding: '16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffd700' }}>⚙️ 設置</span>
        </div>
      </header>

      <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
        {/* User Section */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👤</div>
            <div>
              {user ? (
                <>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{user.email}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>已登入</div>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>訪客</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>登入以保存數據</div>
                </>
              )}
            </div>
          </div>
          
          {user ? (
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px', background: 'rgba(255,92,92,0.2)', border: 'none', borderRadius: '10px', color: '#ff5c5c', fontWeight: 'bold', cursor: 'pointer' }}>登出</button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #ffd700, #daa520)', border: 'none', borderRadius: '10px', color: '#0a0a1a', fontWeight: 'bold', cursor: 'pointer' }}>登入 / 註冊</button>
          )}
        </div>

        {/* Display Settings */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>📱 顯示設置</h3>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            {/* Unit Preference */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#fff', fontWeight: 'bold', marginBottom: '12px' }}>顯示單位</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => saveUnit('tael')} style={{ flex: 1, padding: '14px', background: preferredUnit === 'tael' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${preferredUnit === 'tael' ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: preferredUnit === 'tael' ? '#ffd700' : '#888', cursor: 'pointer' }}>
                  💰 両 (Tael)
                </button>
                <button onClick={() => saveUnit('gram')} style={{ flex: 1, padding: '14px', background: preferredUnit === 'gram' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${preferredUnit === 'gram' ? '#ffd700' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', color: preferredUnit === 'gram' ? '#ffd700' : '#888', cursor: 'pointer' }}>
                  ⚖️ 克 (Gram)
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>選擇後，所有價格將使用您選擇的單位顯示</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>🔔 通知設置</h3>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ color: '#fff' }}>價格變動通知</span>
              <div onClick={() => setNotifications(!notifications)} style={{ width: '50px', height: '28px', background: notifications ? '#ffd700' : 'rgba(255,255,255,0.2)', borderRadius: '14px', position: 'relative', transition: '0.3s' }}>
                <div style={{ width: '24px', height: '24px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: notifications ? '24px' : '2px', transition: '0.3s' }}></div>
              </div>
            </label>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '12px' }}>當金價有重大變動時通知您</p>
          </div>
        </div>

        {/* About */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>ℹ️ 關於</h3>
          
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>版本</span>
              <span style={{ color: '#fff' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#888' }}>數據更新</span>
              <span style={{ color: '#fff' }}>2024年3月5日</span>
            </div>
            <div style={{ color: '#666', fontSize: '12px', marginTop: '16px', lineHeight: '1.6' }}>
              貴金屬管家 - 您的黃金資產管理專家<br/>
              支援周大福、周生生金價查詢
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }} onClick={() => setShowAuth(false)}>
          <div style={{ background: '#1a1a3e', padding: '32px', borderRadius: '20px', width: '100%', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '20px' }}>{isLogin ? '登入' : '註冊'}</h3>
            
            <form onSubmit={handleAuth}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="電子郵件" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', marginBottom: '12px' }} required />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="密碼" style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', marginBottom: '12px' }} required />
              {error && <p style={{ color: '#ff5c5c', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}
              <button type="submit" style={{ width: '100%', padding: '14px', background: '#ffd700', border: 'none', borderRadius: '10px', color: '#0a0a1a', fontWeight: 'bold', cursor: 'pointer' }}>{isLogin ? '登入' : '註冊'}</button>
            </form>
            
            <div style={{ textAlign: 'center', margin: '16px 0', color: '#888' }}>或</div>
            
            <button onClick={handleGoogleLogin} style={{ width: '100%', padding: '14px', background: '#fff', border: 'none', borderRadius: '10px', color: '#333', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              使用 Google 登入
            </button>
            
            <p style={{ textAlign: 'center', marginTop: '16px', color: '#888', fontSize: '14px' }}>
              {isLogin ? '還沒有賬戶？' : '已有賬戶？'}
              <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#ffd700', cursor: 'pointer', marginLeft: '8px' }}>{isLogin ? '立即註冊' : '立即登入'}</button>
            </p>
          </div>
        </div>
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
