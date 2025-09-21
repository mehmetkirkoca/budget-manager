import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';

const DraggableWidgetVertical = ({
  id,
  index,
  rowIndex,
  columnIndex,
  children,
  onMoveWithinColumn,
  className = ''
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'WIDGET_VERTICAL',
    item: { id, index, rowIndex, columnIndex, widgetId: id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'WIDGET_VERTICAL',
    drop: (item) => {
      if (item.widgetId !== id &&
          item.rowIndex === rowIndex &&
          item.columnIndex === columnIndex) {
        // Reorder within the same column
        onMoveWithinColumn(rowIndex, columnIndex, item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;

  // Combine drag and drop refs
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-200 ${
        isDragging ? 'scale-105 shadow-lg cursor-grabbing' : 'cursor-grab'
      } ${
        isOver
          ? 'border-t-2 border-blue-500'
          : ''
      }`}
      style={{ opacity }}
    >
      {children}

      {/* Drop indicator */}
      {isOver && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10"></div>
      )}
    </div>
  );
};

export default DraggableWidgetVertical;