'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Firebase will be initialized on client side only
let auth = null;
let db = null;

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [firebaseReady, setFirebaseReady] = useState(false);
  
  const [prices, setPrices] = useState({
    chowtaifook: { sell: null, buy: null },
    chowsangsang: { sell: null, buy: null }
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
  const [calcResult, setCalcResult] = useState(null);

  // Initialize Firebase on client side
  useEffect(() => {
    async function initFirebase() {
      try {
        const { initializeApp } = await import('firebase/app');
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
        const { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } = await import('firebase/firestore');
        
        const firebaseConfig = {
          apiKey: "AIzaSyDTAQgCvZO7Q9Y9A2rSWf0HL1uyA0iJwj4",
          authDomain: "gold-6b24b.firebaseapp.com",
          projectId: "gold-6b24b",
          storageBucket: "gold-6b24b.firebasestorage.app",
          messagingSenderId: "1095159481868",
          appId: "1:1095159481868:web:af30df2ff4cc0427e05029"
        };
        
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Set up auth listener
        onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
          setFirebaseReady(true);
          if (user) {
            loadRecords(user.uid);
          } else {
            setRecords([]);
          }
        });
        
        // Make functions available globally
        window.firebaseAuth = { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
        window.firebaseDb = { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy };
      } catch (error) {
        console.error('Firebase init error:', error);
        setLoading(false);
      }
    }
    
    initFirebase();
  }, []);

  const loadRecords = (uid) => {
    if (!window.firebaseDb || !db) return;
    const { collection, onSnapshot, query, orderBy } = window.firebaseDb;
    const q = query(
      collection(db, 'users', uid, 'records'),
      orderBy('createdAt', 'desc')
    );
    
    onSnapshot(q, (snapshot) => {
      const recordsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setRecords(recordsData);
    });
  };

  const handleAuth = async (e) =>Default();
    setAuthError('');
    
 {
    e.prevent    if (!window.firebaseAuth) return;
    
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.firebaseAuth;
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    if (!window.firebaseAuth) return;
    const { signOut } = window.firebaseAuth;
    await signOut(auth);
  };

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!user || !newRecord.weight || !newRecord.price || !window.firebaseDb) return;
    
    const { collection, addDoc } = window.firebaseDb;
    
    await addDoc(collection(db, 'users', user.uid, 'records'), {
      type: newRecord.type,
      weight: parseFloat(newRecord.weight),
      price: parseFloat(newRecord.price),
      note: newRecord.note,
      total: parseFloat(newRecord.weight) * parseFloat(newRecord.price),
      source: selectedSource,
      createdAt: new Date()
    });
    
    setNewRecord({ type: 'buy', weight: '', price: '', note: '' });
    setShowAddForm(false);
  };

  const handleDeleteRecord = async (id) => {
    if (!user || !window.firebaseDb || !confirm('確定要刪除這筆記錄嗎？')) return;
    const { deleteDoc, doc } = window.firebaseDb;
    await deleteDoc(doc(db, 'users', user.uid, 'records', id));
  };

  const fetchPrices = async (force = false) => {
    try {
      const response = await fetch(`/api/prices?force=${force}`);
      const result = await response.json();
      if (result.success && result.data) {
        setPrices(result.data);
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
    const price = prices[selectedSource][calcType];
    if (!price) return;
    const total = parseFloat(calcWeight) * price;
    const gramWeight = parseFloat(calcWeight) * 37.429;
    setCalcResult({ total, gramWeight, price });
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

  if (loading || !firebaseReady) {
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

            {/* Current Price */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">💰 當前金價</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {lastUpdate ? new Date(lastUpdate).toLocaleTimeString('zh-HK') : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(0,214,143,0.1)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>售價</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>
                    HK$ {prices[selectedSource]?.sell?.toLocaleString() || '--'}
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,92,92,0.1)', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>回收價</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--danger)' }}>
                    HK$ {prices[selectedSource]?.buy?.toLocaleString() || '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculator */}
            <div className="card calculator-section">
              <h3 className="card-title">🧮 黃金計算機</h3>
              <div className="calc-form">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">重量（両）</label>
                  <input
                    type="number"
                    className="form-input"
                    value={calcWeight}
                    onChange={e => setCalcWeight(e.target.value)}
                    placeholder="輸入重量"
                  />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">計算類型</label>
                  <select 
                    className="form-select"
                    value={calcType}
                    onChange={e => setCalcType(e.target.value)}
                  >
                    <option value="sell">按售價</option>
                    <option value="buy">按回收價</option>
                  </select>
                </div>
                
                <button onClick={handleCalculate} className="btn btn-primary" style={{ alignSelf: 'end' }}>
                  計算
                </button>
              </div>
              
              {calcResult && (
                <div className="calc-result">
                  <div className="calc-result-label">使用 {calcType === 'sell' ? '售價' : '回收價'}：HK$ {calcResult.price?.toLocaleString()}/両</div>
                  <div className="calc-result-value">HK$ {calcResult.total.toLocaleString()}</div>
                  <div className="calc-result-gram">≈ {calcResult.gramWeight.toFixed(2)} 克</div>
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
                          當前售價：HK$ {prices[selectedSource]?.sell?.toLocaleString() || '--'}/両
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
                          <span>💵 HK$ {record.price?.toLocaleString()}/両</span>
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
