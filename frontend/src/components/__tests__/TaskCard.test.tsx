import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from '../TaskCard';
import type { Task } from '../../types';

const baseTask: Task = {
  _id: 'task-1',
  title: 'My Task',
  description: 'A short task description',
  status: 'todo',
  position: 0,
  board: 'board-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

/**
 * Wraps TaskCard in the required DragDropContext + Droppable providers.
 */
const renderTaskCard = (task: Task = baseTask, index = 0) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  const utils = render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="test-droppable">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <TaskCard task={task} index={index} onEdit={onEdit} onDelete={onDelete} />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );

  return { ...utils, onEdit, onDelete };
};

describe('TaskCard', () => {
  it('renders task title', () => {
    renderTaskCard();
    expect(screen.getByText('My Task')).toBeInTheDocument();
  });

  it('renders task description', () => {
    renderTaskCard();
    expect(screen.getByText('A short task description')).toBeInTheDocument();
  });

  it('truncates long descriptions to 100 characters', () => {
    const longDesc = 'A'.repeat(150);
    const task: Task = { ...baseTask, description: longDesc };
    renderTaskCard(task);
    expect(screen.getByText('A'.repeat(100) + '...')).toBeInTheDocument();
  });

  it('does not render description when it is absent', () => {
    const task: Task = { ...baseTask, description: undefined };
    renderTaskCard(task);
    expect(screen.getByText('My Task')).toBeInTheDocument();
    expect(screen.queryByText('A short task description')).not.toBeInTheDocument();
  });

  it('shows edit and delete buttons', () => {
    renderTaskCard();
    expect(screen.getByTitle('Edit task')).toBeInTheDocument();
    expect(screen.getByTitle('Delete task')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderTaskCard();
    await user.click(screen.getByTitle('Edit task'));
    expect(onEdit).toHaveBeenCalledWith(baseTask);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderTaskCard();
    await user.click(screen.getByTitle('Delete task'));
    expect(onDelete).toHaveBeenCalledWith('task-1');
  });

  it('has the task-card class', () => {
    renderTaskCard();
    const title = screen.getByText('My Task');
    // The task-card class is on the outer div wrapping the title
    expect(title.closest('.task-card')).toBeInTheDocument();
  });
});
