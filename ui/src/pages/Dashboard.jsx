
import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SummaryCard from '../components/SummaryCard';
import ExpensePieChart from '../components/ExpensePieChart';
import AssetProgress from '../components/AssetProgress';
import DashboardCalendar from '../components/DashboardCalendar';
import AutoProcessSummary from '../components/AutoProcessSummary';
import CreditCardSummary from '../components/CreditCardSummary';
import DraggableWidget from '../components/DraggableWidget';
import RowLayoutSelector from '../components/RowLayoutSelector';
import DropZone from '../components/DropZone';
import WidgetSelector from '../components/WidgetSelector';
import { getSummary } from '../services/dashboardService';
import { getAllExpenses } from '../services/expenseService';
import { getAllAssets } from '../services/assetService';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiRefreshCw, FiPlus, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const { rows, moveWidget, swapWidgets, resetLayout, changeRowColumns, addRow, removeRow, getRowClasses, addWidgetToRow, removeWidgetFromRow, getAvailableWidgets } = useWidgetLayout();
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForWidget, setSelectedRowForWidget] = useState(null);
  const [selectedColumnForWidget, setSelectedColumnForWidget] = useState(null);
  const [summaryData, setSummaryData] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalBalance: 0,
    totalAssets: 0
  });
  const [expenseData, setExpenseData] = useState([]);
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    document.title = `${t('dashboard')} - ${t('appTitle')}`;
    fetchDashboardData();
  }, [t]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summary, expenses, assets] = await Promise.all([
        getSummary(),
        getAllExpenses(),
        getAllAssets()
      ]);
      
      setSummaryData({
        monthlyIncome: summary.monthlyIncome,
        monthlyExpenses: summary.monthlyExpenses,
        totalBalance: summary.totalBalance,
        totalAssets: summary.totalAssets
      });
      
      setExpenseData(expenses);
      setAssetData(assets);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const cards = [
    { title: t('monthlyIncome'), value: summaryData.monthlyIncome, icon: <FiTrendingUp />, color: 'text-green-500' },
    { title: t('monthlyExpenses'), value: summaryData.monthlyExpenses, icon: <FiTrendingDown />, color: 'text-red-500' },
    { title: t('totalBalance'), value: summaryData.totalBalance, icon: <FiDollarSign />, color: 'text-blue-500' },
    { title: t('totalAssets'), value: summaryData.totalAssets, icon: <FiActivity />, color: 'text-indigo-500' },
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
            <ExpensePieChart data={expenseData} />
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
            <DashboardCalendar />
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
        <div className="space-y-6">
          {rows && rows.map((row, rowIndex) => (
            <div key={row.id}>
              {editMode && (
                <RowLayoutSelector
                  rowIndex={rowIndex}
                  columnCount={row.columns}
                  onColumnChange={changeRowColumns}
                  onAddRow={addRow}
                  onRemoveRow={removeRow}
                  canRemove={rows.length > 1}
                />
              )}
              
              <div className={getRowClasses(row.columns)}>
                {Array.from({ length: row.columns }, (_, columnIndex) => {
                  const widget = row.widgets && row.widgets[columnIndex];

                  if (widget) {
                    // Widget exists for this column
                    return editMode ? (
                      <div key={widget.id} className="relative group">
                        <DraggableWidget
                          id={widget.id}
                          index={columnIndex}
                          rowIndex={rowIndex}
                          swapWidgets={swapWidgets}
                          className="transition-all duration-200 hover:scale-[1.02]"
                        >
                          {renderWidget(widget)}
                        </DraggableWidget>
                        <button
                          onClick={() => removeWidgetFromRow(rowIndex, columnIndex)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title={t('delete')}
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ) : (
                      <div key={widget.id}>
                        {renderWidget(widget)}
                      </div>
                    );
                  } else {
                    // Empty slot - show DropZone and Add Widget button only in edit mode
                    return editMode ? (
                      <div key={`empty-${rowIndex}-${columnIndex}`} className="relative">
                        <DropZone
                          onDrop={(item) => {
                            if (item.widgetId) {
                              // Moving existing widget
                              const fromRowIndex = rows.findIndex(r =>
                                r.widgets && r.widgets.some(w => w && w.id === item.widgetId)
                              );
                              if (fromRowIndex !== -1) {
                                // Find the widget index in the filtered array (only non-null widgets)
                                const sourceRow = rows[fromRowIndex];
                                const filteredWidgets = (sourceRow.widgets || []).filter(w => w);
                                const fromWidgetIndex = filteredWidgets.findIndex(w => w.id === item.widgetId);

                                moveWidget(fromRowIndex, fromWidgetIndex, rowIndex, columnIndex);
                              }
                            }
                          }}
                          className="min-h-[100px] cursor-pointer"
                        />
                        <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50">
                          <button
                            onClick={() => {
                              setSelectedRowForWidget(rowIndex);
                              setSelectedColumnForWidget(columnIndex);
                              setShowWidgetSelector(true);
                            }}
                            className="flex items-center justify-center"
                          >
                            <FiPlus className="mr-2" size={16} />
                            {t('addWidget')}
                          </button>
                        </div>
                      </div>
                    ) : null;
                  }
                })}
              </div>
            </div>
          ))}
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
      </div>
    </DndProvider>
  );
};

export default Dashboard;
