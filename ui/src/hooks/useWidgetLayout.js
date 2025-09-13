import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dashboard-widget-layout';

const ALL_AVAILABLE_WIDGETS = [
  { id: 'summary-cards', type: 'summary-cards', name: 'Summary Cards' },
  { id: 'expense-chart', type: 'expense-chart', name: 'Expense Chart' },
  { id: 'asset-progress', type: 'asset-progress', name: 'Asset Progress' },
  { id: 'calendar', type: 'calendar', name: 'Calendar' },
  { id: 'auto-process', type: 'auto-process', name: 'Auto Process' },
  { id: 'credit-cards', type: 'credit-cards', name: 'Credit Cards' }
];

const DEFAULT_ROWS = [
  {
    id: 'row-0',
    columns: 1,
    widgets: [{ id: 'summary-cards', type: 'summary-cards' }]
  },
  {
    id: 'row-1', 
    columns: 2,
    widgets: [
      { id: 'expense-chart', type: 'expense-chart' },
      { id: 'asset-progress', type: 'asset-progress' }
    ]
  },
  {
    id: 'row-2',
    columns: 2, 
    widgets: [
      { id: 'calendar', type: 'calendar' },
      { id: 'auto-process', type: 'auto-process' }
    ]
  },
  {
    id: 'row-3',
    columns: 1,
    widgets: [{ id: 'credit-cards', type: 'credit-cards' }]
  }
];

export const useWidgetLayout = () => {
  const [rows, setRows] = useState(DEFAULT_ROWS || []);

  // Load row layout from localStorage on mount
  useEffect(() => {
    try {
      const savedRows = localStorage.getItem(STORAGE_KEY);

      if (savedRows) {
        const parsedRows = JSON.parse(savedRows);
        setRows(parsedRows);
      }
    } catch (error) {
      console.error('Error loading row layout:', error);
      localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
      setRows(DEFAULT_ROWS);
    }
  }, []);

  // Save row layout to localStorage
  const saveLayout = useCallback((newRows) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRows));
      setRows(newRows);
    } catch (error) {
      console.error('Error saving row layout:', error);
    }
  }, []);

  // Change column count for a row
  const changeRowColumns = useCallback((rowIndex, columnCount) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      columns: columnCount
    };
    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Add new row
  const addRow = useCallback((insertIndex) => {
    const newRow = {
      id: `row-${Date.now()}`,
      columns: 1,
      widgets: []
    };
    const updatedRows = [...rows];
    updatedRows.splice(insertIndex, 0, newRow);
    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Remove row
  const removeRow = useCallback((rowIndex) => {
    if (rows.length <= 1) return; // Don't allow removing the last row
    const updatedRows = rows.filter((_, index) => index !== rowIndex);
    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Move widget between rows/positions
  const moveWidget = useCallback((fromRowIndex, fromWidgetIndex, toRowIndex, toWidgetIndex) => {
    const updatedRows = [...rows];
    const fromRow = updatedRows[fromRowIndex];
    const toRow = updatedRows[toRowIndex];

    // Find the actual widget by filtering out nulls
    const sourceWidgets = (fromRow.widgets || []).filter(w => w);
    if (!sourceWidgets[fromWidgetIndex]) {
      return;
    }

    const movedWidget = sourceWidgets[fromWidgetIndex];

    // Remove widget from source row (clear its position)
    if (fromRow.widgets) {
      // Find and clear the position in the original array
      for (let i = 0; i < fromRow.widgets.length; i++) {
        if (fromRow.widgets[i] && fromRow.widgets[i].id === movedWidget.id) {
          fromRow.widgets[i] = null;
          break;
        }
      }
    }

    // Ensure target row has widgets array with proper size
    if (!toRow.widgets) {
      toRow.widgets = new Array(toRow.columns).fill(null);
    } else {
      // Extend array if needed
      while (toRow.widgets.length < toRow.columns) {
        toRow.widgets.push(null);
      }
    }

    // Place widget at specific position
    toRow.widgets[toWidgetIndex] = movedWidget;

    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Add widget to specific row
  const addWidgetToRow = useCallback((rowIndex, widgetId, columnIndex = null) => {
    const widget = ALL_AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;

    const updatedRows = [...rows];
    const row = updatedRows[rowIndex];

    // Ensure widgets array exists with proper size
    if (!row.widgets) {
      row.widgets = new Array(row.columns).fill(null);
    } else {
      // Extend array if needed
      while (row.widgets.length < row.columns) {
        row.widgets.push(null);
      }
    }

    // If columnIndex is specified, place at that position
    // Otherwise find the first empty position
    let targetIndex = columnIndex;
    if (targetIndex === null) {
      targetIndex = row.widgets.findIndex(w => w === null);
      if (targetIndex === -1) {
        // No empty slots, add to end
        targetIndex = row.widgets.length;
        row.widgets.push(null);
      }
    }

    row.widgets[targetIndex] = {
      id: widget.id,
      type: widget.type
    };

    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Remove widget from row
  const removeWidgetFromRow = useCallback((rowIndex, widgetIndex) => {
    const updatedRows = [...rows];
    const row = updatedRows[rowIndex];

    if (row.widgets) {
      // Find the actual widget by filtering out nulls and getting by index
      const actualWidgets = row.widgets.filter(w => w);
      const widgetToRemove = actualWidgets[widgetIndex];

      if (widgetToRemove) {
        // Find and clear the position in the array
        for (let i = 0; i < row.widgets.length; i++) {
          if (row.widgets[i] && row.widgets[i].id === widgetToRemove.id) {
            row.widgets[i] = null;
            break;
          }
        }
      }
    }

    saveLayout(updatedRows);
  }, [rows, saveLayout]);

  // Swap two widgets within the same row
  const swapWidgets = useCallback((rowIndex, fromColumnIndex, toColumnIndex) => {
    const updatedRows = [...rows];
    const row = updatedRows[rowIndex];

    if (row.widgets && row.widgets[fromColumnIndex] && row.widgets[toColumnIndex]) {
      // Swap the widgets
      [row.widgets[fromColumnIndex], row.widgets[toColumnIndex]] =
      [row.widgets[toColumnIndex], row.widgets[fromColumnIndex]];

      saveLayout(updatedRows);
    }
  }, [rows, saveLayout]);

  // Get available widgets (not used in any row)
  const getAvailableWidgets = useCallback(() => {
    const usedWidgetIds = rows.flatMap(row =>
      (row.widgets || []).filter(widget => widget).map(widget => widget.id)
    );

    return ALL_AVAILABLE_WIDGETS.filter(widget =>
      !usedWidgetIds.includes(widget.id)
    );
  }, [rows]);


  // Reset to default layout
  const resetLayout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRows([...DEFAULT_ROWS]);
    } catch (error) {
      console.error('Error resetting layout:', error);
      setRows([...DEFAULT_ROWS]);
    }
  }, []);

  // Get CSS classes for a row based on column count
  const getRowClasses = useCallback((columnCount) => {
    switch (columnCount) {
      case 1:
        return 'grid grid-cols-1 gap-6';
      case 2:
        return 'grid grid-cols-1 md:grid-cols-2 gap-6';
      case 3:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      case 4:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
      default:
        return 'grid grid-cols-1 gap-6';
    }
  }, []);

  return {
    rows,
    moveWidget,
    swapWidgets,
    resetLayout,
    changeRowColumns,
    addRow,
    removeRow,
    getRowClasses,
    addWidgetToRow,
    removeWidgetFromRow,
    getAvailableWidgets
  };
};