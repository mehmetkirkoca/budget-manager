import { useDrag, useDrop } from 'react-dnd';
import { useRef } from 'react';

const ItemType = {
  WIDGET: 'widget'
};

const DraggableWidget = ({ id, index, rowIndex, children, swapWidgets, className = '' }) => {
  const ref = useRef(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemType.WIDGET,
    drop: (item) => {
      if (item.widgetId !== id && swapWidgets && item.rowIndex === rowIndex) {
        // Swap widgets if they're in the same row
        swapWidgets(rowIndex, item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType.WIDGET,
    item: () => {
      return { id, index, rowIndex, widgetId: id };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`${className} cursor-move transition-opacity`}
      style={{ opacity }}
    >
      {children}
    </div>
  );
};

export default DraggableWidget;