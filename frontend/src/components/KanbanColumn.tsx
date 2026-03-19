import { Droppable } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function KanbanColumn({ status, tasks, onAddTask, onEditTask, onDeleteTask }: KanbanColumnProps) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          {STATUS_LABELS[status]} <span className="kanban-column-count">{tasks.length}</span>
        </h3>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`kanban-column-body${snapshot.isDraggingOver ? ' kanban-column-dragover' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task._id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <button className="btn btn-add-task" onClick={() => onAddTask(status)}>
        + Add Task
      </button>
    </div>
  );
}
