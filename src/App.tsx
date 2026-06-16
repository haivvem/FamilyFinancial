import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Transaction, TransactionInput } from './types';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { StatsChart } from './components/StatsChart';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('family_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      showToast(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດຂໍ້ມູນ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Show toast utility
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Add or Update transaction
  const handleSaveTransaction = async (input: TransactionInput) => {
    try {
      if (editingTransaction) {
        // Update existing record
        const { error } = await supabase
          .from('family_records')
          .update({
            date: input.date,
            type: input.type,
            category: input.category,
            amount: input.amount,
            remark: input.remark || null
          })
          .eq('id', editingTransaction.id);

        if (error) throw error;
        showToast('ອັບເດດຂໍ້ມູນສຳເລັດແລ້ວ');
        setEditingTransaction(null);
      } else {
        // Insert new record
        const { error } = await supabase
          .from('family_records')
          .insert([
            {
              date: input.date,
              type: input.type,
              category: input.category,
              amount: input.amount,
              remark: input.remark || null
            }
          ]);

        if (error) throw error;
        showToast('ບັນທຶກຂໍ້ມູນໃໝ່ສຳເລັດແລ້ວ');
      }
      // Refresh list
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ', 'error');
      throw err;
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: number) => {
    try {
      const { error } = await supabase
        .from('family_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('ລຶບຂໍ້ມູນສຳເລັດແລ້ວ');
      // Refresh list
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການລຶບຂໍ້ມູນ', 'error');
      throw err;
    }
  };

  // Select transaction for editing
  const handleStartEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    // Scroll to form smoothly on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  // Computations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  // Format currency helper
  const formatCurrency = (val: number) => {
    const formatted = new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' })
      .format(Math.abs(val))
      .replace('LAK', '₭');
    return val < 0 ? `-${formatted}` : formatted;
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="app-container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <header className="app-header" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="header-title-area">
            <div className="app-logo">₭</div>
            <div className="header-text">
              <h1>ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍຄອບຄົວ</h1>
            </div>
          </div>
        </header>
        
        <div className="card" style={{ borderLeft: '4px solid var(--color-expense)' }}>
          <h3 className="card-title" style={{ color: 'var(--color-expense)', marginBottom: '1rem' }}>
            ⚠️ ບໍ່ພົບການກຳນົດຄ່າ Supabase (Configuration Missing)
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            ເວັບແອັບພລິເຄຊັນນີ້ຕ້ອງການການເຊື່ອມຕໍ່ກັບ Supabase ເພື່ອເກັບກຳຂໍ້ມູນ. ເນື່ອງຈາກໄຟລ໌ <code>.env</code> ບໍ່ໄດ້ຖືກອັບໂຫຼດຂຶ້ນ GitHub (ເພື່ອຄວາມປອດໄພ), ທ່ານຕ້ອງເພີ່ມຕົວປ່ຽນສະພາບແວດລ້ອມ (Environment Variables) ຢູ່ໃນເວັບໄຊ Vercel.
          </p>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>ວິທີແກ້ໄຂເທິງ Vercel Dashboard:</h4>
            <ol style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <li>ເຂົ້າໄປທີ່ <strong>Vercel Dashboard</strong> ຂອງໂຄງການທ່ານ</li>
              <li>ໄປທີ່ເມນູ <strong>Settings</strong> &gt; <strong>Environment Variables</strong></li>
              <li>ເພີ່ມຕົວປ່ຽນ 2 ລາຍການນີ້:</li>
            </ol>

            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>NAME 1:</span>
                <code style={{ color: 'var(--color-income)', fontSize: '0.9rem', fontWeight: 600 }}>VITE_SUPABASE_URL</code>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>VALUE:</span>
                <input readOnly value="https://fcebkjvwmkilyjbfaczh.supabase.co" className="input-control" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', marginTop: '0.2rem', cursor: 'text' }} onClick={(e) => (e.target as HTMLInputElement).select()} />
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>NAME 2:</span>
                <code style={{ color: 'var(--color-income)', fontSize: '0.9rem', fontWeight: 600 }}>VITE_SUPABASE_ANON_KEY</code>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>VALUE:</span>
                <textarea readOnly value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZWJranZ3bWtpbHlqYmZhY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkxMzcsImV4cCI6MjA5NzE1NTEzN30.pX1XHpjSzw6WbXqsJDWChg9jQgD6Wk20wssgRZ-kAkE" className="input-control" style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', marginTop: '0.2rem', minHeight: '65px', cursor: 'text', fontFamily: 'monospace' }} onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: '1.5' }}>
            💡 ຫຼັງຈາກເພີ່ມທັງສອງລາຍການແລ້ວ, ໃຫ້ໄປທີ່ເມນູ <strong>Deployments</strong>, ກົດປຸ່ມ <strong>...</strong> (ສາມຈຸດ) ຢູ່ Deployment ຫຼ້າສຸດ ແລະ ເລືອກ <strong>Redeploy</strong> ເພື່ອໃຫ້ແອັບພລິເຄຊັນສະແດງຜົນຢ່າງຖືກຕ້ອງ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header section */}
      <header className="app-header">
        <div className="header-title-area">
          <div className="app-logo">₭</div>
          <div className="header-text">
            <h1>ບັນທຶກລາຍຮັບ-ລາຍຈ່າຍຄອບຄົວ</h1>
            <p>ລະບົບຕິດຕາມ ແລະ ບໍລິຫານການເງິນໃນຄົວເຮືອນຢ່າງມີປະສິດທິພາບ</p>
          </div>
        </div>
      </header>

      {/* Dashboard Summary Cards */}
      <section className="dashboard-summary">
        {/* Balance Card */}
        <div className="card stat-card balance">
          <span className="stat-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="12" y1="17" x2="12" y2="17"/><path d="M12 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5Z"/></svg>
            ຍອດຄົງເຫຼືອທັງໝົດ
          </span>
          <div className="stat-value" style={{ color: balance >= 0 ? 'white' : 'var(--color-expense)' }}>
            {formatCurrency(balance)}
          </div>
          <span className="stat-desc">ລາຍຮັບລວມ ຫັກ ລາຍຈ່າຍລວມ</span>
        </div>

        {/* Income Card */}
        <div className="card stat-card income">
          <span className="stat-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-income)' }}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            ລາຍຮັບລວມ
          </span>
          <div className="stat-value">
            {formatCurrency(totalIncome)}
          </div>
          <span className="stat-desc">ຍອດເງິນທີ່ໄດ້ຮັບເຂົ້າມາທັງໝົດ</span>
        </div>

        {/* Expense Card */}
        <div className="card stat-card expense">
          <span className="stat-label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-expense)' }}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            ລາຍຈ່າຍລວມ
          </span>
          <div className="stat-value">
            {formatCurrency(totalExpense)}
          </div>
          <span className="stat-desc">ຍອດເງິນທີ່ຈ່າຍອອກໄປທັງໝົດ</span>
        </div>
      </section>

      {/* Main Layout Grid */}
      <main className="main-grid">
        {/* Left column: Form and Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <TransactionForm 
            onSave={handleSaveTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={handleCancelEdit}
          />
          <StatsChart transactions={transactions} />
        </div>

        {/* Right column: List table */}
        <div>
          <TransactionList 
            transactions={transactions}
            onEdit={handleStartEdit}
            onDelete={handleDeleteTransaction}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Success/Error Toast notification */}
      {toastMessage && (
        <div className="alert-toast" style={{ borderLeftColor: toastType === 'success' ? 'var(--color-income)' : 'var(--color-expense)' }}>
          <span>{toastType === 'success' ? '✅' : '❌'}</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
