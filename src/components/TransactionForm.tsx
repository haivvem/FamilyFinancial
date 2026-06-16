import { useState, useEffect } from 'react';
import type { Transaction, TransactionInput, TransactionType } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';

interface TransactionFormProps {
  onSave: (data: TransactionInput) => Promise<void>;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  editingTransaction,
  onCancelEdit
}) => {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [remark, setRemark] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Categories list depends on type
  const availableCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Whenever type changes, reset category to first item
  useEffect(() => {
    if (!editingTransaction) {
      setCategory(availableCategories[0]);
    }
  }, [type, editingTransaction]);

  // When editingTransaction changes (e.g. user clicks Edit)
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setRemark(editingTransaction.remark || '');
      setErrorMsg('');
    } else {
      // Reset to default
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setDate(getTodayDateString());
      setRemark('');
      setErrorMsg('');
    }
  }, [editingTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('ກະລຸນາໃສ່ຈຳນວນເງິນທີ່ຖືກຕ້ອງ (ຫຼາຍກວ່າ 0)');
      return;
    }

    if (!category) {
      setErrorMsg('ກະລຸນາເລືອກໝວດໝູ່');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        date,
        type,
        category,
        amount: parsedAmount,
        remark: remark.trim()
      });
      
      // Clear form only if we are not editing (if we were editing, it resets via the prop anyway)
      if (!editingTransaction) {
        setAmount('');
        setRemark('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">
        {editingTransaction ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            ແກ້ໄຂລາຍການ
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}><path d="M12 5v14M5 12h14"/></svg>
            ບັນທຶກລາຍການໃໝ່
          </>
        )}
      </h3>

      <form onSubmit={handleSubmit}>
        {errorMsg && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.1)', 
            border: '1px solid rgba(244, 63, 94, 0.3)', 
            color: 'var(--color-expense)', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '1rem',
            fontSize: '0.85rem' 
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Transaction Type Toggle */}
        <div className="form-group">
          <label className="form-label">ປະເພດ</label>
          <div className="type-toggle">
            <button
              type="button"
              className={`btn-toggle ${type === 'income' ? 'active income' : ''}`}
              onClick={() => setType('income')}
            >
              📈 ລາຍຮັບ
            </button>
            <button
              type="button"
              className={`btn-toggle ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              📉 ລາຍຈ່າຍ
            </button>
          </div>
        </div>

        {/* Date Input */}
        <div className="form-group">
          <label htmlFor="tx-date" className="form-label">ວັນທີ</label>
          <input
            id="tx-date"
            type="date"
            className="input-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Category Dropdown */}
        <div className="form-group">
          <label htmlFor="tx-category" className="form-label">ໝວດໝູ່</label>
          <select
            id="tx-category"
            className="input-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat} style={{ background: '#1e293b' }}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="form-group">
          <label htmlFor="tx-amount" className="form-label">ຈຳນວນເງິນ (ກີບ)</label>
          <input
            id="tx-amount"
            type="number"
            step="any"
            placeholder="ຕົວຢ່າງ: 50000"
            className="input-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Remark Input */}
        <div className="form-group">
          <label htmlFor="tx-remark" className="form-label">ໝາຍເຫດ ( Remark )</label>
          <textarea
            id="tx-remark"
            placeholder="ລາຍລະອຽດເພີ່ມເຕີມ..."
            className="input-control"
            style={{ minHeight: '80px', resize: 'vertical' }}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        {/* Actions Buttons */}
        <div className="btn-row" style={{ marginTop: '1.5rem' }}>
          {editingTransaction && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              ຍົກເລີກ
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                ກຳລັງບັນທຶກ...
              </>
            ) : editingTransaction ? (
              'ອັບເດດຂໍ້ມູນ'
            ) : (
              'ບັນທຶກຂໍ້ມູນ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
