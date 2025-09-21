import { useDrop } from 'react-dnd';
import { FiPlus } from 'react-icons/fi';
import DraggableWidget from './DraggableWidget';
import DraggableWidgetVertical from './DraggableWidgetVertical';

const WidgetColumn = ({
  widgets = [],
  rowIndex,
  columnIndex,
  editMode,
  onAddWidget,
  onRemoveWidget,
  onMoveWidget,
  onMoveWithinColumn,
  renderWidget,
  t
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['WIDGET', 'WIDGET_VERTICAL'],
    drop: (item) => {
      if (item.widgetId && onMoveWidget) {
        // Check if this is from a different column
        if (item.rowIndex !== rowIndex || item.columnIndex !== columnIndex) {
          // Moving widget between columns/rows
          onMoveWidget(
            item.rowIndex,
            item.columnIndex,
            item.index,
            rowIndex,
            columnIndex
          );
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Helper function to find widget position (this would need to be passed down or accessed via context)
  const findWidgetPosition = (widgetId) => {
    // This is a simplified version - in practice you'd need access to all rows
    // For now, we'll handle this in the parent component
    return null;
  };

  return (
    <div
      ref={drop}
      className={`space-y-4 min-h-[100px] p-2 rounded-lg transition-all duration-200 ${
        isOver && canDrop
          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600'
          : 'border-2 border-transparent'
      }`}
    >
      {/* Widgets in this column */}
      {Array.isArray(widgets) && widgets.map((widget, widgetIndex) => (
        <div key={widget.id} className="relative group">
          {editMode ? (
            <DraggableWidgetVertical
              id={widget.id}
              index={widgetIndex}
              rowIndex={rowIndex}
              columnIndex={columnIndex}
              onMoveWithinColumn={onMoveWithinColumn}
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              {renderWidget(widget)}
            </DraggableWidgetVertical>
          ) : (
            renderWidget(widget)
          )}

          {editMode && (
            <button
              onClick={() => onRemoveWidget(rowIndex, columnIndex, widgetIndex)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
              title={t('delete')}
            >
              <FiPlus size={14} style={{ transform: 'rotate(45deg)' }} />
            </button>
          )}
        </div>
      ))}

      {/* Add widget button - always shown in edit mode */}
      {editMode && (
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50">
          <button
            onClick={() => onAddWidget(rowIndex, columnIndex)}
            className="flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          >
            <FiPlus className="mr-2" size={16} />
            {t('addWidget')}
          </button>
        </div>
      )}

      {/* Empty state for non-edit mode */}
      {!editMode && (!Array.isArray(widgets) || widgets.length === 0) && (
        <div className="flex items-center justify-center p-8 text-gray-400 dark:text-gray-600">
          <span className="text-sm">{t('emptyColumn')}</span>
        </div>
      )}
    </div>
  );
};

export default WidgetColumn;