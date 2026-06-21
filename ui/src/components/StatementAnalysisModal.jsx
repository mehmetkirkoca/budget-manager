import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { creditCardInstallmentService, creditCardUtils } from '../services/creditCardService';
import { getAllCategories } from '../services/categoryService';

const StatementAnalysisModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [installments, setInstallments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [instData, catData] = await Promise.all([
        creditCardInstallmentService.getAllInstallments({ status: 'active' }),
        getAllCategories(),
      ]);
      const items = instData.installments || instData.data || instData || [];
      setInstallments(items);
      const map = {};
      items.forEach(i => { map[i._id] = i.category?._id || i.category || ''; });
      setCategoryMap(map);
      setCategories(catData);
      setLoading(false);
    };
    fetchData().catch(err => { console.error(err); setLoading(false); });
  }, []);

  const handleCategoryChange = (id, catId) => {
    setCategoryMap(prev => ({ ...prev, [id]: catId }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = installments
        .filter(i => categoryMap[i._id] !== (i.category?._id || i.category || ''))
        .map(i =>
          creditCardInstallmentService.updateInstallment(i._id, {
            category: categoryMap[i._id] || null,
          })
        );
      await Promise.all(updates);
      setInstallments(prev =>
        prev.map(i => ({ ...i, category: categoryMap[i._id] || null }))
      );
    } finally {
      setSaving(false);
    }
  };

  // Grafik verisi: her taksitin kalan ödemelerini aylara yay, installmentAmount topla
  const filtered = selectedCat
    ? installments.filter(i => (categoryMap[i._id] || '') === selectedCat)
    : installments;

  const byMonth = {};
  filtered.forEach(i => {
    if (!i.nextPaymentDate || !i.remainingInstallments) return;
    const start = new Date(i.nextPaymentDate);
    const baseYear = start.getUTCFullYear();
    const baseMonth = start.getUTCMonth();
    for (let m = 0; m < i.remainingInstallments; m++) {
      const total = baseYear * 12 + baseMonth + m;
      const key = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
      byMonth[key] = (byMonth[key] || 0) + (i.installmentAmount || 0);
    }
  });
  const chartData = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total: Math.round(total) }));

  const cardLabel = inst => {
    const cc = inst.creditCard;
    if (!cc) return '';
    return `${cc.bankName} ****${cc.cardNumber}`;
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-500 dark:text-gray-400">{t('loading')}</div>;
  }

  if (installments.length === 0) {
    return (
      <div className="py-10 text-center text-gray-500 dark:text-gray-400">
        {t('noActiveInstallments')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kategori seçici + Bar grafik */}
      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {t('category')}
          </label>
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-1 focus:ring-indigo-400"
          >
            <option value="">{t('allCategories') || 'Tümü'}</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {chartData.length > 0 && (
            <span className="text-xs text-gray-400 ml-auto">
              Kalan: {creditCardUtils.formatCurrency(filtered.reduce((s, i) => s + (i.installmentAmount || 0) * (i.remainingInstallments || 0), 0))}
            </span>
          )}
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip
                formatter={v => [creditCardUtils.formatCurrency(v), 'Harcama']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
            Bu kategoride harcama yok
          </div>
        )}
      </div>

      {/* Taksit tablosu - aya göre gruplu */}
      {(() => {
        const grouped = {};
        filtered.forEach(inst => {
          const key = inst.nextPaymentDate
            ? new Date(inst.nextPaymentDate).toISOString().slice(0, 7)
            : '9999-99';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(inst);
        });
        const sortedMonths = Object.keys(grouped).sort();
        const fmtMonth = m => {
          if (m === '9999-99') return '—';
          const [y, mo] = m.split('-');
          return new Date(+y, +mo - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        };

        return (
          <div className="overflow-auto max-h-72 border rounded-lg dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{t('description')}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{t('creditCard')}</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">{t('originalAmount')}</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">{t('monthlyPayment')}</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">{t('remaining')}</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">{t('category')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedMonths.map(month => {
                  const rows = grouped[month];
                  const monthTotal = rows.reduce((s, i) => s + (i.installmentAmount || 0), 0);
                  return (
                    <>
                      <tr key={`hdr-${month}`}>
                        <td
                          colSpan={6}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                        >
                          {fmtMonth(month)}
                          <span className="ml-2 font-normal text-indigo-500">
                            — {creditCardUtils.formatCurrency(monthTotal)}
                          </span>
                        </td>
                      </tr>
                      {rows.map(inst => (
                        <tr
                          key={inst._id}
                          className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-200 max-w-[180px] truncate" title={inst.purchaseDescription}>
                            {inst.purchaseDescription}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {cardLabel(inst)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            {creditCardUtils.formatCurrency(inst.originalAmount)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                            {creditCardUtils.formatCurrency(inst.installmentAmount)}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">
                            {inst.remainingInstallments}/{inst.totalInstallments}
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={categoryMap[inst._id] || ''}
                              onChange={e => handleCategoryChange(inst._id, e.target.value)}
                              className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 focus:ring-1 focus:ring-indigo-400"
                            >
                              <option value="">{t('selectCategory')}</option>
                              {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Butonlar */}
      <div className="flex justify-end space-x-3 pt-2 border-t dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded-lg text-sm dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {t('close')}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center text-sm"
        >
          <FiSave className="mr-1.5" />
          {saving ? t('loading') : t('save')}
        </button>
      </div>
    </div>
  );
};

export default StatementAnalysisModal;
