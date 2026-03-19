import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import BoardCard from '../components/BoardCard';
import CreateBoardModal from '../components/CreateBoardModal';
import * as boardsApi from '../api/boards';
import type { Board } from '../types';

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      const data = await boardsApi.getBoards();
      setBoards(data);
    } catch {
      // Error handled silently; boards remain empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = () => {
    setEditingBoard(null);
    setModalOpen(true);
  };

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setModalOpen(true);
  };

  const handleDelete = async (boardId: string) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch {
      // Deletion error handled silently
    }
  };

  const handleSubmit = async (data: { title: string; description?: string }) => {
    try {
      if (editingBoard) {
        const updated = await boardsApi.updateBoard(editingBoard._id, data);
        setBoards((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      } else {
        const created = await boardsApi.createBoard(data);
        setBoards((prev) => [...prev, created]);
      }
      setModalOpen(false);
      setEditingBoard(null);
    } catch {
      // Submit error handled silently
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="dashboard-header">
          <h1>My Boards</h1>
          <button className="btn btn-primary" onClick={handleCreate}>
            + Create Board
          </button>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : boards.length === 0 ? (
          <div className="empty-state">
            <p>No boards yet. Create your first board to get started!</p>
          </div>
        ) : (
          <div className="boards-grid">
            {boards.map((board) => (
              <BoardCard
                key={board._id}
                board={board}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
      <CreateBoardModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBoard(null);
        }}
        onSubmit={handleSubmit}
        board={editingBoard}
      />
    </div>
  );
}
