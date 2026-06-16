import { useState } from 'react';
import type { Transaction } from '../types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => Promise<void>;
  isLoading: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  isLoading
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('lo-LA', { style: 'currency', currency: 'LAK' })
      .format(val)
      .replace('LAK', '₭');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesSearch = !searchQuery || 
      (t.remark && t.remark.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  // Handle Delete Confirmation
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ລຳດັບ', 'ວັນທີ', 'ປະເພດ', 'ໝວດໝູ່', 'ຈຳນວນເງິນ', 'ໝາຍເຫດ'];
    const rows = filteredTransactions.map((t, index) => [
      index + 1,
      t.date,
      t.type === 'income' ? 'ລາຍຮັບ' : 'ລາຍຈ່າຍ',
      t.category,
      t.amount,
      t.remark || ''
    ]);
    
    // Add UTF-8 BOM so Excel opens Lao text correctly
    const csvContent = "\ufeff" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `ລາຍງານການເງິນ_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="toolbar">
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          ລາຍການບັນທຶກທັງໝົດ ({filteredTransactions.length})
        </h3>
        
        {filteredTransactions.length > 0 && (
          <button onClick={handleExportCSV} className="btn-export">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            ສົ່ງອອກ CSV
          </button>
        )}
      </div>

      {/* Filters Area */}
      <div className="toolbar" style={{ backgroundColor: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
        <div className="filters-wrapper">
          {/* Type Filter */}
          <select 
            className="select-filter"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterCategory('all'); // reset category filter
            }}
          >
            <option value="all">ທັງໝົດ</option>
            <option value="income">📈 ລາຍຮັບ</option>
            <option value="expense">📉 ລາຍຈ່າຍ</option>
          </select>

          {/* Category Filter */}
          <select 
            className="select-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">ທຸກໝວດໝູ່</option>
            {filterType !== 'expense' && INCOME_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
            {filterType !== 'income' && EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Search Box */}
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="ຄົ້ນຫາໝາຍເຫດ..."
            className="input-control"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="loading-overlay">
          <span className="spinner"></span>
          ກຳລັງໂຫຼດຂໍ້ມູນ...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-icon" style={{ fontSize: '2.5rem' }}>🔍</p>
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>ບໍ່ພົບຂໍ້ມູນລາຍການ</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ລອງປ່ຽນເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ເພີ່ມລາຍການໃໝ່</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table-records">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>ລຳດັບ</th>
                <th style={{ width: '110px' }}>ວັນທີ</th>
                <th style={{ width: '90px' }}>ປະເພດ</th>
                <th>ໝວດໝູ່</th>
                <th style={{ textAlign: 'right', width: '150px' }}>ຈຳນວນເງິນ</th>
                <th>ໝາຍເຫດ</th>
                <th style={{ width: '90px', textAlign: 'center' }}>ຈັດການ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {idx + 1}
                  </td>
                  <td>
                    {tx.date}
                  </td>
                  <td>
                    <span className={`badge ${tx.type}`}>
                      {tx.type === 'income' ? 'ລາຍຮັບ' : 'ລາຍຈ່າຍ'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {tx.category}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`amount-value ${tx.type}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td style={{ color: tx.remark ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {tx.remark || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={() => onEdit(tx)} 
                        className="btn-icon edit"
                        title="ແກ້ໄຂ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(tx.id)} 
                        className="btn-icon delete"
                        title="ລຶບ"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4 className="modal-header">⚠️ ຢືນຢັນການລຶບລາຍການ</h4>
            <p className="modal-body">
              ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບລາຍການນີ້? ຂໍ້ມູນທີ່ລຶບແລ້ວຈະບໍ່ສາມາດກູ້ຄືນໄດ້.
            </p>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                style={{ width: 'auto' }}
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
              >
                ຍົກເລີກ
              </button>
              <button 
                className="btn btn-danger" 
                style={{ width: 'auto' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'ກຳລັງລຶບ...' : 'ຢືນຢັນລຶບ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
