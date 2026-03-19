import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card${snapshot.isDragging ? ' task-card-dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-card-header">
            <h4 className="task-card-title">{task.title}</h4>
            <div className="task-card-actions">
              <button
                className="icon-btn"
                title="Edit task"
                onClick={() => onEdit(task)}
              >
                &#9998;
              </button>
              <button
                className="icon-btn icon-btn-danger"
                title="Delete task"
                onClick={() => onDelete(task._id)}
              >
                &#128465;
              </button>
            </div>
          </div>
          {task.description && (
            <p className="task-card-desc">
              {task.description.length > 100
                ? task.description.slice(0, 100) + '...'
                : task.description}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
}
