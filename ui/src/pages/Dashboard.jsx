
import { useEffect, useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SummaryCard from '../components/SummaryCard';
import ExpensePieChart from '../components/ExpensePieChart';
import AssetProgress from '../components/AssetProgress';
import DashboardCalendar from '../components/DashboardCalendar';
import AutoProcessSummary from '../components/AutoProcessSummary';
import CreditCardSummary from '../components/CreditCardSummary';
import NotesWidget from '../components/NotesWidget';
import DraggableWidget from '../components/DraggableWidget';
import DraggableRow from '../components/DraggableRow';
import RowLayoutSelector from '../components/RowLayoutSelector';
import DropZone from '../components/DropZone';
import WidgetSelector from '../components/WidgetSelector';
import WidgetColumn from '../components/WidgetColumn';
import Modal from '../components/Modal';
import { getSummary } from '../services/dashboardService';
import { getAllAssets } from '../services/assetService';
import { getAllIncomes } from '../services/incomeService';
import { getAllRecurringPayments } from '../services/recurringPaymentService';
import { creditCardService, creditCardUtils } from '../services/creditCardService';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiRefreshCw, FiPlus, FiEdit, FiCheck, FiX, FiEye } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const fmt = value => creditCardUtils.formatCurrency(value || 0);

const Dashboard = () => {
  const { t } = useTranslation();
  const { rows, moveWidget, swapWidgets, moveWidgetWithinColumn, moveRow, resetLayout, changeRowColumns, addRow, removeRow, getRowClasses, addWidgetToRow, removeWidgetFromRow, getAvailableWidgets } = useWidgetLayout();
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForWidget, setSelectedRowForWidget] = useState(null);
  const [selectedColumnForWidget, setSelectedColumnForWidget] = useState(null);

  const [summaryDetailModal, setSummaryDetailModal] = useState(null);
  const [incomesData, setIncomesData] = useState([]);
  const [recurringPaymentsData, setRecurringPaymentsData] = useState([]);
  const [creditCardsData, setCreditCardsData] = useState([]);

  // Helper function to find widget position
  const findWidgetPosition = (widgetId) => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      if (row.widgets) {
        for (let columnIndex = 0; columnIndex < row.widgets.length; columnIndex++) {
          const column = row.widgets[columnIndex];
          if (Array.isArray(column)) {
            const widgetIndex = column.findIndex(w => w && w.id === widgetId);
            if (widgetIndex !== -1) {
              return { rowIndex, columnIndex, widgetIndex };
            }
          }
        }
      }
    }
    return null;
  };
  const [summaryData, setSummaryData] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalBalance: 0,
    totalAssets: 0
  });
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = `${t('dashboard')} - ${t('appTitle')}`;
    fetchDashboardData();
  }, [t]);

  const handleCurrentMonthTotal = useCallback((total) => {
    setSummaryData(prev => {
      if (prev.monthlyExpenses === total) return prev;
      return { ...prev, monthlyExpenses: total };
    });
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, assets, incomes, recurring, cards] = await Promise.all([
        getSummary(),
        getAllAssets(),
        getAllIncomes().catch(() => []),
        getAllRecurringPayments().catch(() => []),
        creditCardService.getAllCreditCards().catch(() => []),
      ]);

      setSummaryData({
        monthlyIncome: summary.monthlyIncome,
        monthlyExpenses: summary.monthlyExpenses,
        totalBalance: summary.totalBalance,
        totalAssets: summary.totalAssets
      });
      setAssetData(assets || []);
      setIncomesData(incomes || []);
      setRecurringPaymentsData(recurring || []);
      setCreditCardsData(cards || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cards = [
    {
      title: t('monthlyIncome'),
      value: summaryData.monthlyIncome,
      icon: <FiTrendingUp />,
      color: 'text-green-500',
      onDetailClick: () => setSummaryDetailModal('monthlyIncome'),
      detailTitle: `${t('monthlyIncome')} Kalemleri`,
    },
    {
      title: t('monthlyExpenses'),
      value: summaryData.monthlyExpenses,
      icon: <FiTrendingDown />,
      color: 'text-red-500',
      onDetailClick: () => setSummaryDetailModal('monthlyExpenses'),
      detailTitle: `${t('monthlyExpenses')} Kalemleri`,
    },
    {
      title: t('totalAssets'),
      value: summaryData.totalAssets,
      icon: <FiActivity />,
      color: 'text-indigo-500',
      onDetailClick: () => setSummaryDetailModal('totalAssets'),
      detailTitle: `${t('totalAssets')} Kalemleri`,
    },
    {
      title: t('totalBalance'),
      value: summaryData.totalBalance,
      icon: <FiDollarSign />,
      color: 'text-blue-500',
      onDetailClick: () => setSummaryDetailModal('totalBalance'),
      detailTitle: `${t('totalBalance')} Kalemleri`,
    },
  ];

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'summary-cards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            {cards.map(card => <SummaryCard key={card.title} {...card} />)}
          </div>
        );
      case 'expense-chart':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <ExpensePieChart />
          </div>
        );
      case 'asset-progress':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <AssetProgress assets={assetData} />
          </div>
        );
      case 'calendar':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <DashboardCalendar
              monthlyIncome={summaryData.monthlyIncome}
              onCurrentMonthTotal={handleCurrentMonthTotal}
            />
          </div>
        );
      case 'auto-process':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <AutoProcessSummary />
          </div>
        );
      case 'credit-cards':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <CreditCardSummary />
          </div>
        );
      case 'notes':
        return <NotesWidget />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto">
        {/* Layout Controls */}
        <div className="flex justify-end items-center mb-6 gap-3">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
              editMode
                ? 'text-white bg-blue-600 border-blue-600 hover:bg-blue-700'
                : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={editMode ? t('exitEditMode') : t('enterEditMode')}
          >
            {editMode ? <FiCheck className="mr-2" size={16} /> : <FiEdit className="mr-2" size={16} />}
            {editMode ? t('exitEditMode') : t('editLayout')}
          </button>
          {editMode && (
            <button
              onClick={resetLayout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={t('resetLayout')}
            >
              <FiRefreshCw className="mr-2" size={16} />
              {t('resetLayout')}
            </button>
          )}
        </div>

        {/* Row-based Widgets */}
        <div className={`space-y-6 ${editMode ? 'pl-8' : ''}`}>
          {rows && rows.map((row, rowIndex) =>
            editMode ? (
              <DraggableRow
                key={row.id}
                rowIndex={rowIndex}
                onMoveRow={moveRow}
              >
                <div>
                  <RowLayoutSelector
                    rowIndex={rowIndex}
                    columnCount={row.columns}
                    onColumnChange={changeRowColumns}
                    onAddRow={addRow}
                    onRemoveRow={removeRow}
                    canRemove={rows.length > 1}
                  />

                  <div className={getRowClasses(row.columns)}>
                    {Array.from({ length: row.columns }, (_, columnIndex) => {
                      const widgets = (row.widgets && Array.isArray(row.widgets[columnIndex]))
                      ? row.widgets[columnIndex]
                      : [];

                      return (
                        <WidgetColumn
                          key={`col-${rowIndex}-${columnIndex}`}
                          widgets={widgets}
                          rowIndex={rowIndex}
                          columnIndex={columnIndex}
                          editMode={editMode}
                          onAddWidget={(rowIdx, colIdx) => {
                            setSelectedRowForWidget(rowIdx);
                            setSelectedColumnForWidget(colIdx);
                            setShowWidgetSelector(true);
                          }}
                          onRemoveWidget={removeWidgetFromRow}
                          onMoveWidget={(fromRowIdx, fromColIdx, fromWidgetIdx, toRowIdx, toColIdx) => {
                            moveWidget(fromRowIdx, fromColIdx, fromWidgetIdx, toRowIdx, toColIdx);
                          }}
                          onMoveWithinColumn={moveWidgetWithinColumn}
                          renderWidget={renderWidget}
                          t={t}
                        />
                      );
                    })}
                  </div>
                </div>
              </DraggableRow>
            ) : (
              <div key={row.id}>
                <div className={getRowClasses(row.columns)}>
                  {Array.from({ length: row.columns }, (_, columnIndex) => {
                    const widgets = (row.widgets && Array.isArray(row.widgets[columnIndex]))
                      ? row.widgets[columnIndex]
                      : [];

                    return (
                      <WidgetColumn
                        key={`col-${rowIndex}-${columnIndex}`}
                        widgets={widgets}
                        rowIndex={rowIndex}
                        columnIndex={columnIndex}
                        editMode={false}
                        onMoveWithinColumn={moveWidgetWithinColumn}
                        renderWidget={renderWidget}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
        
        {/* Widget Selector Modal */}
        {showWidgetSelector && (
          <WidgetSelector
            availableWidgets={getAvailableWidgets()}
            onWidgetSelect={(widgetId) => {
              if (selectedRowForWidget !== null && selectedColumnForWidget !== null) {
                addWidgetToRow(selectedRowForWidget, widgetId, selectedColumnForWidget);
              }
            }}
            onClose={() => {
              setShowWidgetSelector(false);
              setSelectedRowForWidget(null);
              setSelectedColumnForWidget(null);
            }}
          />
        )}

        {/* Summary Detail Modals */}
        <Modal
          isOpen={Boolean(summaryDetailModal)}
          onClose={() => setSummaryDetailModal(null)}
          title={
            summaryDetailModal === 'monthlyIncome' ? `${t('monthlyIncome')} Kalemleri ve Hesaplama Detayı` :
            summaryDetailModal === 'monthlyExpenses' ? `${t('monthlyExpenses')} Kalemleri ve Harcama Dağılımı` :
            summaryDetailModal === 'totalAssets' ? `${t('totalAssets')} Portföyü ve Değerleme Detayları` :
            summaryDetailModal === 'totalBalance' ? `${t('totalBalance')} (Net Likidite) Hesaplama Detayı` :
            'Detaylar'
          }
          size="lg"
        >
          <div className="space-y-4 text-xs text-gray-700 dark:text-gray-200">
            {/* 1. AYLIK GELİR */}
            {summaryDetailModal === 'monthlyIncome' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Toplam Aylık Gelir</span>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{fmt(summaryData.monthlyIncome)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                      {incomesData.filter(i => i.isActive !== false).length} Aktif Gelir Kaynağı
                    </span>
                  </div>
                </div>

                {incomesData.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">Kayıtlı gelir kaynağı bulunamadı.</div>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Gelir Kaynağı</th>
                          <th className="px-3 py-2">Tutar</th>
                          <th className="px-3 py-2">Frekans / Tür</th>
                          <th className="px-3 py-2 text-right">Aylık Eşdeğer Katkı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {incomesData.filter(i => i.isActive !== false).map((income, idx) => {
                          const amt = Number(income.amount) || 0;
                          const monthly = income.isRecurring
                            ? (income.frequency === 'weekly' ? amt * 4.33 : income.frequency === 'quarterly' ? amt / 3 : income.frequency === 'yearly' ? amt / 12 : amt)
                            : amt;

                          return (
                            <tr key={income._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                                {income.title || income.description || income.name || 'Gelir'}
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-semibold">{fmt(income.amount)}</td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[11px]">
                                  {income.isRecurring
                                    ? (income.frequency === 'monthly' ? 'Aylık' : income.frequency === 'weekly' ? 'Haftalık' : income.frequency === 'yearly' ? 'Yıllık' : 'Aylık')
                                    : 'Tek Seferlik'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-emerald-600 dark:text-emerald-400">{fmt(monthly)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. AYLIK GİDERLER */}
            {summaryDetailModal === 'monthlyExpenses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
                  <div>
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">Bu Ayki Toplam Gider Yükü</span>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300 mt-0.5">{fmt(summaryData.monthlyExpenses)}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div>Tekrarlayan: <strong className="text-gray-800 dark:text-gray-200">{fmt(recurringPaymentsData.reduce((s, p) => s + (p.amount || 0), 0))}</strong></div>
                    <div>Kredi Kartları: <strong className="text-gray-800 dark:text-gray-200">{fmt(creditCardsData.reduce((s, c) => s + (c.currentBalance || 0), 0))}</strong></div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Tekrarlayan Ödemeler (Faturalar, Krediler, Aidatlar)</h4>
                  <div className="overflow-x-auto max-h-[25vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Ödeme Başlığı</th>
                          <th className="px-3 py-2">Kategori</th>
                          <th className="px-3 py-2">Vade Günü</th>
                          <th className="px-3 py-2 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {recurringPaymentsData.filter(p => p.isActive !== false).map((payment, idx) => (
                          <tr key={payment._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{payment.name || payment.title || 'Ödeme'}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{payment.category?.name || '-'}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">Her ayın {payment.dayOfMonth || 1}. günü</td>
                            <td className="px-3 py-2 text-right font-bold text-red-600 dark:text-red-400">{fmt(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Kredi Kartları Borç / Ekstre Kalemleri</h4>
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase">
                        <tr>
                          <th className="px-3 py-2">Banka / Kart Adı</th>
                          <th className="px-3 py-2">Hesap Kesim</th>
                          <th className="px-3 py-2">Son Ödeme</th>
                          <th className="px-3 py-2 text-right">Güncel Borç</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {creditCardsData.map((card, idx) => (
                          <tr key={card._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{card.bankName} - {card.name}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Ayın {card.statementDay}. günü</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">Ayın {card.paymentDueDay}. günü</td>
                            <td className="px-3 py-2 text-right font-bold text-red-600 dark:text-red-400">{fmt(card.currentBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. TOPLAM VARLIK */}
            {summaryDetailModal === 'totalAssets' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <div>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Toplam Portföy / Varlık Değeri</span>
                    <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{fmt(summaryData.totalAssets)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200">
                      {assetData.length} Kayıtlı Varlık
                    </span>
                  </div>
                </div>

                {assetData.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">Kayıtlı varlık bulunamadı.</div>
                ) : (
                  <div className="overflow-x-auto max-h-[50vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Varlık Adı</th>
                          <th className="px-3 py-2">Tür / Kategori</th>
                          <th className="px-3 py-2">Miktar / Para Birimi</th>
                          <th className="px-3 py-2 text-right">TRY Değeri</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {assetData.map((asset, idx) => (
                          <tr key={asset._id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">{asset.name}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[11px] uppercase">
                                {asset.assetType || asset.type || 'Varlık'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium">
                              {asset.currentAmount ? `${asset.currentAmount.toLocaleString('tr-TR')} ${asset.currency || 'TRY'}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {fmt(asset.currentValueTRY || asset.currentAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 4. TOPLAM BAKİYE */}
            {summaryDetailModal === 'totalBalance' && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">Net Likidite Formülü</span>
                    <span className="text-base font-bold text-blue-800 dark:text-blue-200">{fmt(summaryData.totalBalance)}</span>
                  </div>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    Toplam Bakiye = Toplam Likit Varlıklar - Toplam Kredi Kartı Borçları
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Likit Varlıklar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+ Likit Varlıklar</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{fmt(assetData.reduce((s, a) => s + (a.currentValueTRY || a.currentAmount || 0), 0))}</span>
                    </div>
                    <div className="overflow-y-auto max-h-[35vh] space-y-1.5 pr-1">
                      {assetData.map((asset, idx) => (
                        <div key={asset._id || idx} className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs">
                          <div>
                            <span className="font-medium text-gray-800 dark:text-gray-200 block">{asset.name}</span>
                            <span className="text-[10px] text-gray-400">{asset.assetType || asset.type}</span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(asset.currentValueTRY || asset.currentAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Kredi Kartı Borçları */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">- Kredi Kartı Borçları</span>
                      <span className="text-xs font-bold text-red-700 dark:text-red-300">-{fmt(creditCardsData.reduce((s, c) => s + (c.currentBalance || 0), 0))}</span>
                    </div>
                    <div className="overflow-y-auto max-h-[35vh] space-y-1.5 pr-1">
                      {creditCardsData.length === 0 ? (
                        <div className="text-xs text-gray-400 py-4 text-center">Kayıtlı kredi kartı borcu yok.</div>
                      ) : (
                        creditCardsData.map((card, idx) => (
                          <div key={card._id || idx} className="flex justify-between items-center p-2 rounded bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 text-xs">
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200 block">{card.bankName} - {card.name}</span>
                              <span className="text-[10px] text-gray-400">Son Ödeme: Ayın {card.paymentDueDay}. günü</span>
                            </div>
                            <span className="font-bold text-red-600 dark:text-red-400">-{fmt(card.currentBalance)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default Dashboard;
