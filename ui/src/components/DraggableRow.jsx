import { useDrag, useDrop } from 'react-dnd';
import { FiMove, FiMoreVertical } from 'react-icons/fi';

const DraggableRow = ({ children, rowIndex, onMoveRow, isDragging: parentIsDragging }) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ROW',
    item: { rowIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'ROW',
    drop: (item) => {
      if (item.rowIndex !== rowIndex) {
        onMoveRow(item.rowIndex, rowIndex);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  const ref = (node) => {
    drag(node);
    drop(node);
  };

  return (
    <div
      ref={preview}
      className={`relative transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${
        isOver && canDrop ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 rounded-lg' : ''
      }`}
      style={{
        transform: isDragging ? 'rotate(2deg)' : 'none',
      }}
    >
      {/* Drag Handle */}
      <div
        ref={ref}
        className={`absolute -left-8 top-1/2 transform -translate-y-1/2 cursor-move p-2 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors ${
          isDragging ? 'text-blue-600' : ''
        }`}
        title="Satırı sürükleyerek taşı"
      >
        <FiMoreVertical size={16} />
      </div>

      {/* Drop Indicator Top */}
      {isOver && canDrop && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>
      )}

      {/* Row Content */}
      <div className={`transition-all duration-200 ${isDragging ? 'pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Drop Indicator Bottom */}
      {isOver && canDrop && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );
};

export default DraggableRow;