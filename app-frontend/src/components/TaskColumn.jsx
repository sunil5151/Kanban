import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

function TaskColumn({ title, tasks = [], droppableId, onRefresh }) {
  return (
    <div className="task-column">
      <h2>{title}</h2>
      <Droppable droppableId={droppableId} isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
        {(provided, snapshot) => (
          <div
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {Array.isArray(tasks) && tasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index} 
                onRefresh={onRefresh}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default TaskColumn;