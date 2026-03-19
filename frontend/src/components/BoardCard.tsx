import { useNavigate } from 'react-router-dom';
import type { Board } from '../types';

interface BoardCardProps {
  board: Board;
  onEdit: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export default function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const navigate = useNavigate();

  return (
    <div className="board-card" onClick={() => navigate(`/boards/${board._id}`)}>
      <div className="board-card-header">
        <h3 className="board-card-title">{board.title}</h3>
        <div className="board-card-actions">
          <button
            className="icon-btn"
            title="Edit board"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(board);
            }}
          >
            &#9998;
          </button>
          <button
            className="icon-btn icon-btn-danger"
            title="Delete board"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(board._id);
            }}
          >
            &#128465;
          </button>
        </div>
      </div>
      {board.description && <p className="board-card-desc">{board.description}</p>}
    </div>
  );
}
