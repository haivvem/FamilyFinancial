import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
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
