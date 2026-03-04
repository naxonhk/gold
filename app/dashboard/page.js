'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [prices, setPrices] = useState({
    chowtaifook: { 
      gold999: { sell: 57890, sellGram: 1546.66, buy: 46310, buyGram: 1237.28 }, 
      goldPellet: { sell: 52120, sellGram: 1392.5, buy: 47520, buyGram: 1269.6 },
      goldRedemption: { buy: 47810, buyGram: 1277.35 }
    },
    chowsangsang: { 
      goldOrnaments: { sell: 57890, sellGram: 1547, exchange: 48050, exchangeGram: 1283, buy: 46310, buyGram: 1237 }, 
      goldIngot: { sell: 55370, sellGram: 1480, buy: 46310, buyGram: 1237 }, 
      goldBars: { sell: 52110, sellGram: 1393, buy: 47520, buyGram: 1269 }
    }
  });
  const [selectedSource, setSelectedSource] = useState('chowtaifook');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    type: 'buy',
    weight: '',
    price: '',
    note: ''
  });
  
  const [calcWeight, setCalcWeight] = useState('');
  const [calcType, setCalcType] = useState('sell');
  const [calcWeightUnit, setCalcWeightUnit] = useState('tael');
  const [calcGoldType, setCalcGoldType] = useState('gold999');
  const [calcResult, setCalcResult] = useState(null);

  // Use refs for Firebase instances
  const authRef = useRef(null);
  const dbRef = useRef(null);
  const googleProviderRef = useRef(null);
  const initialized = useRef(false);

  // Initialize Firebase from CDN
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    function initFirebase() {
      const checkFirebase = setInterval(() => {
        // Check if Firebase and all required modules are loaded
        if (window.firebase && window.firebase.initializeApp && window.firebase.auth && window.firebase.firestore) {
          clearInterval(checkFirebase);
          
          const firebaseConfig = {
            apiKey: "AIzaSyDTAQgCvZO7Q9Y9A2rSWf0HL1uyA0iJwj4",
            authDomain: "gold-6b24b.firebaseapp.com",
            projectId: "gold-6b24b",
            storageBucket: "gold-6b24b.firebasestorage.app",
            messagingSenderId: "1095159481868",
            appId: "1:1095159481868:web:af30df2ff4cc0427e05029"
          };
          
          try {
            const app = window.firebase.initializeApp(firebaseConfig);
            authRef.current = window.firebase.auth(app);
            dbRef.current = window.firebase.firestore(app);
            googleProviderRef.current = new window.firebase.auth.GoogleAuthProvider();
            
            // Set up auth listener
            authRef.current.onAuthStateChanged((user) => {
              setUser(user);
              setLoading(false);
              if (user) {
                loadRecords(user.uid);
              } else {
                setRecords([]);
              }
            });
          } catch (e) {
            console.error('Firebase init error:', e);
            setLoading(false);
          }
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkFirebase);
        if (!authRef.current) {
          console.log('Firebase init timeout');
          setLoading(false);
        }
      }, 10000);
    }
    
    initFirebase();
  }, []);

  const loadRecords = (uid) => {
    if (!dbRef.current) return;
    
    dbRef.current.collection('users').doc(uid).collection('records')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const recordsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setRecords(recordsData);
      }, (error) => {
        console.error('Records load error:', error);
      });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (!authRef.current) {
      setAuthError('系統載入中，請稍候再試');
      return;
    }
    
    try {
      if (isLogin) {
        await authRef.current.signInWithEmailAndPassword(email, password);
      } else {
        await authRef.current.createUserWithEmailAndPassword(email, password);
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    
    if (!authRef.current || !googleProviderRef.current) {
      setAuthError('系統載入中，請稍候再試');
      return;
    }
    
    try {
      await authRef.current.signInWithPopup(googleProviderRef.current);
      setShowAuthModal(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    if (!authRef.current) return;
    await authRef.current.signOut();
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!user || !newRecord.weight || !newRecord.price || !dbRef.current) return;
    
    await dbRef.current.collection('users').doc(user.uid).collection('records').add({
      type: newRecord.type,
      weight: parseFloat(newRecord.weight),
      price: parseFloat(newRecord.price),
      note: newRecord.note,
      total: parseFloat(newRecord.weight) * parseFloat(newRecord.price),
      source: selectedSource,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });
    
    setNewRecord({ type: 'buy', weight: '', price: '', note: '' });
    setShowAddForm(false);
  };

  const handleDeleteRecord = async (id) => {
    if (!user || !dbRef.current || !confirm('確定要刪除這筆記錄嗎？')) return;
    await dbRef.current.collection('users').doc(user.uid).collection('records').doc(id).delete();
  };

  const fetchPrices = async (force = false) => {
    try {
      const response = await fetch(`/api/prices?force=${force}&t=${Date.now()}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // Ensure data structure is correct
        const newPrices = {
          chowtaifook: result.data.chowtaifook || {},
          chowsangsang: result.data.chowsangsang || {}
        };
        setPrices(newPrices);
        setLastUpdate(result.lastUpdate);
      }
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => fetchPrices(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCalculate = () => {
    if (!calcWeight) return;
    
    // Get the price based on gold type and source
    const sourcePrices = prices[selectedSource];
    const goldTypePrices = sourcePrices[calcGoldType];
    
    if (!goldTypePrices) return;
    
    const pricePerTael = goldTypePrices[calcType];
    if (!pricePerTael) return;
    
    // Convert to tael if input is in grams
    const weightInTael = calcWeightUnit === 'gram' 
      ? parseFloat(calcWeight) / 37.429 
      : parseFloat(calcWeight);
    
    const total = weightInTael * pricePerTael;
    const weightInGram = weightInTael * 37.429;
    
    setCalcResult({ 
      total, 
      weightInGram, 
      weightInTael,
      pricePerTael,
      pricePerGram: pricePerTael / 37.429,
      goldTypeName: calcGoldType
    });
  };

  const filteredRecords = filter === 'all' 
    ? records 
    : records.filter(r => r.type === filter);

  const totalValue = records.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalWeight = records.reduce((sum, r) => sum + (r.weight || 0), 0);
  const buyRecords = records.filter(r => r.type === 'buy');
  const sellRecords = records.filter(r => r.type === 'sell');
  const totalBuy = buyRecords.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalSell = sellRecords.reduce((sum, r) => sum + (r.total || 0), 0);
  const profit = totalSell - totalBuy;

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link href="/" className="logo">
              <span className="logo-icon">🏆</span>
              <span className="logo-text">貴金屬管家</span>
            </Link>
            
            <nav className="nav">
              <Link href="/" className="nav-link">首頁</Link>
              <Link href="/dashboard" className="nav-link active">我的資產</Link>
            </nav>
            
            <div className="user-section">
              {user ? (
                <>
                  <span className="user-email">{user.email}</span>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm">登出</button>
                </>
              ) : (
                <button onClick={() => setShowAuthModal(true)} className="btn btn-primary btn-sm">
                  登入
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>×</button>
            <h2 className="modal-title">{isLogin ? '登入' : '註冊'}</h2>
            <p className="modal-subtitle">
              {isLogin ? '登入您的賬戶' : '創建新賬戶開始記錄'}
            </p>
            
            <form onSubmit={handleAuth}>
              <div className="form-group">
                <label className="form-label">電子郵件</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">密碼</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              {authError && (
                <p style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '14px' }}>
                  {authError}
                </p>
              )}
              
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {isLogin ? '登入' : '註冊'}
              </button>
            </form>
            
            {/* Google Login Button */}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '12px' }}>或</p>
              <button 
                onClick={handleGoogleLogin}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  background: '#fff', 
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                使用 Google 登入
              </button>
            </div>
            
            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
              {isLogin ? '還沒有賬戶？' : '已有賬戶？'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--primary)', 
                  cursor: 'pointer',
                  marginLeft: '8px',
                  fontWeight: '600'
                }}
              >
                {isLogin ? '立即註冊' : '立即登入'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container">
        {!user ? (
          <div className="auth-required">
            <div className="auth-icon">🔐</div>
            <h2 className="auth-title">登入以查看您的資產</h2>
            <p className="auth-desc">
              登入或註冊以開始記錄和管理您的貴金屬資產，追蹤您的投資價值和收益。
            </p>
            <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ width: '100%', maxWidth: '280px' }}>
              立即登入
            </button>
          </div>
        ) : (
          <div className="dashboard">
            <div className="dashboard-header">
              <h1>我的資產</h1>
              <div className="dashboard-controls">
                <select 
                  className="form-select" 
                  style={{ width: 'auto', minWidth: '120px' }}
                  value={selectedSource}
                  onChange={e => setSelectedSource(e.target.value)}
                >
                  <option value="chowtaifook">周大福</option>
                  <option value="chowsangsang">周生生</option>
                </select>
                <button 
                  onClick={() => { setRefreshing(true); fetchPrices(true); }} 
                  className="btn btn-secondary btn-sm"
                  disabled={refreshing}
                >
                  {refreshing ? '🔄' : '🔄 刷新'}
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">總價值</div>
                <div className="stat-value">HK$ {totalValue.toLocaleString()}</div>
                <div className="stat-change">{totalWeight.toFixed(2)} 両</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">總投入</div>
                <div className="stat-value" style={{ color: 'var(--danger)' }}>
                  HK$ {totalBuy.toLocaleString()}
                </div>
                <div className="stat-change">{buyRecords.length} 筆</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">總回收</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>
                  HK$ {totalSell.toLocaleString()}
                </div>
                <div className="stat-change">{sellRecords.length} 筆</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-label">賬面損益</div>
                <div className="stat-value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {profit >= 0 ? '+' : ''}HK$ {profit.toLocaleString()}
                </div>
                <div className="stat-change" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {profit >= 0 ? '賺錢' : '虧錢'}
                </div>
              </div>
            </div>

            {/* Current Price - All Gold Types */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">💰 當前金價</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('zh-HK') : ''}
                </span>
              </div>
              
              {selectedSource === 'chowtaifook' ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* 999.9 Gold */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.08)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>💎 999.9 黃金</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>售價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>HK$ {prices.chowtaifook?.gold999?.sell?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowtaifook?.gold999?.sellGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowtaifook?.gold999?.buy?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowtaifook?.gold999?.buyGram}/克</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gold Pellet */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>🪙 黃金粒 (投資黃金)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>售價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>HK$ {prices.chowtaifook?.goldPellet?.sell?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowtaifook?.goldPellet?.sellGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowtaifook?.goldPellet?.buy?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowtaifook?.goldPellet?.buyGram}/克</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gold Redemption */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>🔄 黃金贖回價 / 珠寶換購價</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowtaifook?.goldRedemption?.buy?.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowtaifook?.goldRedemption?.buyGram}/克</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {/* Gold Ornaments */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.08)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>💍 黃金飾品</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>售價</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>HK$ {prices.chowsangsang?.goldOrnaments?.sell?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldOrnaments?.sellGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>兌換價</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: '#60a5fa' }}>HK$ {prices.chowsangsang?.goldOrnaments?.exchange?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldOrnaments?.exchangeGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                        <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowsangsang?.goldOrnaments?.buy?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldOrnaments?.buyGram}/克</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gold Ingot */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>📐 金條</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>售價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>HK$ {prices.chowsangsang?.goldIngot?.sell?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldIngot?.sellGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowsangsang?.goldIngot?.buy?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldIngot?.buyGram}/克</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gold Bars */}
                  <div style={{ padding: '16px', background: 'rgba(255,215,0,0.05)', borderRadius: '12px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--primary)' }}>🪙 金粒</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>售價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--success)' }}>HK$ {prices.chowsangsang?.goldBars?.sell?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldBars?.sellGram}/克</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>回收價</div>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>HK$ {prices.chowsangsang?.goldBars?.buy?.toLocaleString()}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HK$ {prices.chowsangsang?.goldBars?.buyGram}/克</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Calculator */}
            <div className="card calculator-section">
              <h3 className="card-title">🧮 黃金計算機</h3>
              <div className="calc-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">黃金類型</label>
                  <select 
                    className="form-select"
                    value={calcGoldType}
                    onChange={e => setCalcGoldType(e.target.value)}
                  >
                    {selectedSource === 'chowtaifook' ? (
                      <>
                        <option value="gold999">999.9 黃金</option>
                        <option value="goldPellet">黃金粒</option>
                      </>
                    ) : (
                      <>
                        <option value="goldOrnaments">黃金飾品</option>
                        <option value="goldIngot">金條</option>
                        <option value="goldBars">金粒</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">重量</label>
                  <input
                    type="number"
                    className="form-input"
                    value={calcWeight}
                    onChange={e => setCalcWeight(e.target.value)}
                    placeholder="輸入重量"
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">單位</label>
                  <select 
                    className="form-select"
                    value={calcWeightUnit}
                    onChange={e => setCalcWeightUnit(e.target.value)}
                  >
                    <option value="tael">両</option>
                    <option value="gram">克</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">價格</label>
                  <select 
                    className="form-select"
                    value={calcType}
                    onChange={e => setCalcType(e.target.value)}
                  >
                    <option value="sell">售價</option>
                    <option value="buy">回收價</option>
                  </select>
                </div>
                
                <button onClick={handleCalculate} className="btn btn-primary" style={{ alignSelf: 'end' }}>
                  計算
                </button>
              </div>
              
              {calcResult && (
                <div className="calc-result">
                  <div className="calc-result-label">使用 {calcType === 'sell' ? '售價' : '回收價'}：HK$ {calcResult.price?.toLocaleString()}/両</div>
                  <div className="calc-result-value">HK$ {calcResult.total?.toLocaleString()}</div>
                  <div className="calc-result-gram">≈ {calcResult.gramWeight?.toFixed(2)} 克</div>
                </div>
              )}
            </div>

            {/* Records */}
            <div className="records-section">
              <div className="records-header">
                <h3 className="card-title" style={{ marginBottom: 0 }}>📝 記錄列表</h3>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary btn-sm">
                  + 新增
                </button>
              </div>
              
              {/* Add Form */}
              {showAddForm && (
                <div className="card" style={{ marginBottom: '20px', marginTop: '16px' }}>
                  <form onSubmit={handleAddRecord}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">類型</label>
                        <select 
                          className="form-select"
                          value={newRecord.type}
                          onChange={e => setNewRecord({...newRecord, type: e.target.value})}
                        >
                          <option value="buy">買入</option>
                          <option value="sell">賣出</option>
                          <option value="gift">送出</option>
                        </select>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">重量（両）</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newRecord.weight}
                          onChange={e => setNewRecord({...newRecord, weight: e.target.value})}
                          placeholder="0"
                          step="0.01"
                          required
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                        <label className="form-label">單價（HK$/両）</label>
                        <input
                          type="number"
                          className="form-input"
                          value={newRecord.price}
                          onChange={e => setNewRecord({...newRecord, price: e.target.value})}
                          placeholder={prices[selectedSource]?.sell || ''}
                          required
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                          當前售價：HK$ {prices[selectedSource]?.sell?.toLocaleString() || '--'}/妳
                        </small>
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                        <label className="form-label">備註（選填）</label>
                        <input
                          type="text"
                          className="form-input"
                          value={newRecord.note}
                          onChange={e => setNewRecord({...newRecord, note: e.target.value})}
                          placeholder="新增備註..."
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>儲存</button>
                      <button type="button" onClick={() => setShowAddForm(false)} className="btn btn-secondary">取消</button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Filters */}
              <div className="records-filters">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  全部 ({records.length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'buy' ? 'active' : ''}`}
                  onClick={() => setFilter('buy')}
                >
                  買入 ({buyRecords.length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'sell' ? 'active' : ''}`}
                  onClick={() => setFilter('sell')}
                >
                  賣出 ({sellRecords.length})
                </button>
              </div>
              
              {/* Records List */}
              {filteredRecords.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📒</div>
                  <div className="empty-title">暫無記錄</div>
                  <p>點擊「新增」開始記錄您的貴金屬資產</p>
                </div>
              ) : (
                <div className="records-list">
                  {filteredRecords.map(record => (
                    <div key={record.id} className="record-item">
                      <div className="record-info">
                        <span className={`record-type ${record.type}`}>
                          {record.type === 'buy' ? '買入' : record.type === 'sell' ? '賣出' : '送出'}
                        </span>
                        <div className="record-details">
                          <span>📊 {record.weight} 両</span>
                          <span>💵 HK$ {record.price?.toLocaleString()}/妳</span>
                          <span>🏪 {record.source === 'chowtaifook' ? '周大福' : '周生生'}</span>
                        </div>
                        {record.note && (
                          <div className="record-details" style={{ marginTop: '4px', fontSize: '13px' }}>📝 {record.note}</div>
                        )}
                      </div>
                      <div className="record-value">
                        <div className="record-total">HK$ {record.total?.toLocaleString()}</div>
                        <div className="record-date">
                          {record.createdAt?.toLocaleDateString?.('zh-HK') || new Date().toLocaleDateString('zh-HK')}
                        </div>
                        <button 
                          onClick={() => handleDeleteRecord(record.id)}
                          className="btn btn-danger btn-sm"
                          style={{ marginTop: '8px' }}
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <Link href="/" className="mobile-nav-item">
          <span>🏠</span>
          <span>首頁</span>
        </Link>
        <Link href="/dashboard" className="mobile-nav-item active">
          <span>💰</span>
          <span>資產</span>
        </Link>
      </nav>
    </div>
  );
}
