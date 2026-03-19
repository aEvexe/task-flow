import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BoardCard from '../BoardCard';
import type { Board } from '../../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const baseBoard: Board = {
  _id: 'board-1',
  title: 'My Board',
  description: 'A test board description',
  owner: 'user-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('BoardCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderCard = (board: Board = baseBoard) =>
    render(
      <MemoryRouter>
        <BoardCard board={board} onEdit={onEdit} onDelete={onDelete} />
      </MemoryRouter>,
    );

  it('renders board title and description', () => {
    renderCard();
    expect(screen.getByText('My Board')).toBeInTheDocument();
    expect(screen.getByText('A test board description')).toBeInTheDocument();
  });

  it('does not render description when it is absent', () => {
    const boardWithoutDesc: Board = { ...baseBoard, description: undefined };
    renderCard(boardWithoutDesc);
    expect(screen.getByText('My Board')).toBeInTheDocument();
    expect(screen.queryByText('A test board description')).not.toBeInTheDocument();
  });

  it('navigates to board page when card is clicked', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByText('My Board'));
    expect(mockNavigate).toHaveBeenCalledWith('/boards/board-1');
  });

  it('shows edit and delete buttons', () => {
    renderCard();
    expect(screen.getByTitle('Edit board')).toBeInTheDocument();
    expect(screen.getByTitle('Delete board')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked without navigating', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByTitle('Edit board'));
    expect(onEdit).toHaveBeenCalledWith(baseBoard);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked without navigating', async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByTitle('Delete board'));
    expect(onDelete).toHaveBeenCalledWith('board-1');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
