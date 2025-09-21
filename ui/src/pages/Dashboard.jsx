
import { useEffect, useState } from 'react';
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
import { getSummary } from '../services/dashboardService';
import { getAllExpenses } from '../services/expenseService';
import { getAllAssets } from '../services/assetService';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiRefreshCw, FiPlus, FiEdit, FiCheck, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { t } = useTranslation();
  const { rows, moveWidget, swapWidgets, moveWidgetWithinColumn, moveRow, resetLayout, changeRowColumns, addRow, removeRow, getRowClasses, addWidgetToRow, removeWidgetFromRow, getAvailableWidgets } = useWidgetLayout();
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowForWidget, setSelectedRowForWidget] = useState(null);
  const [selectedColumnForWidget, setSelectedColumnForWidget] = useState(null);

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
    { title: t('totalAssets'), value: summaryData.totalAssets, icon: <FiActivity />, color: 'text-indigo-500' },
    { title: t('totalBalance'), value: summaryData.totalBalance, icon: <FiDollarSign />, color: 'text-blue-500' },
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
      </div>
    </DndProvider>
  );
};

export default Dashboard;
