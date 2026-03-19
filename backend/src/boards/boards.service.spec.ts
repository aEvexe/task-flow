import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { Board } from './board.schema';
import { TasksService } from '../tasks/tasks.service';

describe('BoardsService', () => {
  let boardsService: BoardsService;
  let tasksService: Partial<Record<keyof TasksService, jest.Mock>>;

  const mockBoardModel = jest.fn();
  const mockSave = jest.fn();
  const mockExec = jest.fn();

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup constructor mock — calling `new mockBoardModel(data)` returns an object with .save()
    mockBoardModel.mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      save: mockSave,
    }));

    // Static methods on the model
    mockBoardModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    mockBoardModel.findById = jest.fn().mockReturnValue({ exec: mockExec });
    mockBoardModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: jest.fn() });

    tasksService = {
      deleteAllByBoard: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        { provide: getModelToken(Board.name), useValue: mockBoardModel },
        { provide: TasksService, useValue: tasksService },
      ],
    }).compile();

    boardsService = module.get<BoardsService>(BoardsService);
  });

  describe('create', () => {
    it('should create a board', async () => {
      const createBoardDto = { title: 'Test Board', description: 'A test board' };
      const userId = 'user-id-123';
      const savedBoard = {
        _id: 'board-id-123',
        title: 'Test Board',
        description: 'A test board',
        owner: userId,
      };
      mockSave.mockResolvedValue(savedBoard);

      const result = await boardsService.create(createBoardDto, userId);

      expect(mockBoardModel).toHaveBeenCalledWith({
        title: 'Test Board',
        description: 'A test board',
        owner: userId,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedBoard);
    });
  });

  describe('findAllByUser', () => {
    it('should find all boards by user', async () => {
      const userId = 'user-id-123';
      const boards = [
        { _id: 'board-1', title: 'Board 1', owner: userId },
        { _id: 'board-2', title: 'Board 2', owner: userId },
      ];
      mockExec.mockResolvedValue(boards);

      const result = await boardsService.findAllByUser(userId);

      expect(mockBoardModel.find).toHaveBeenCalledWith({ owner: userId });
      expect(result).toEqual(boards);
    });
  });

  describe('findById', () => {
    it('should find board by id', async () => {
      const board = { _id: 'board-id-123', title: 'Test Board', owner: 'user-id-123' };
      mockExec.mockResolvedValue(board);

      const result = await boardsService.findById('board-id-123');

      expect(mockBoardModel.findById).toHaveBeenCalledWith('board-id-123');
      expect(result).toEqual(board);
    });

    it('should throw NotFoundException when board not found', async () => {
      mockExec.mockResolvedValue(null);

      await expect(boardsService.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a board when owner matches', async () => {
      const userId = 'user-id-123';
      const existingBoard = {
        _id: 'board-id-123',
        title: 'Old Title',
        owner: { toString: () => userId },
        save: jest.fn(),
      };
      existingBoard.save.mockResolvedValue({
        ...existingBoard,
        title: 'New Title',
      });
      mockExec.mockResolvedValue(existingBoard);

      const result = await boardsService.update(
        'board-id-123',
        { title: 'New Title' },
        userId,
      );

      expect(existingBoard.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException on update if owner does not match', async () => {
      const existingBoard = {
        _id: 'board-id-123',
        title: 'Test Board',
        owner: { toString: () => 'other-user-id' },
        save: jest.fn(),
      };
      mockExec.mockResolvedValue(existingBoard);

      await expect(
        boardsService.update('board-id-123', { title: 'New Title' }, 'user-id-123'),
      ).rejects.toThrow(ForbiddenException);

      expect(existingBoard.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a board and cascade delete tasks', async () => {
      const userId = 'user-id-123';
      const existingBoard = {
        _id: 'board-id-123',
        title: 'Test Board',
        owner: { toString: () => userId },
      };
      mockExec.mockResolvedValue(existingBoard);

      await boardsService.delete('board-id-123', userId);

      expect(tasksService.deleteAllByBoard).toHaveBeenCalledWith('board-id-123');
      expect(mockBoardModel.findByIdAndDelete).toHaveBeenCalledWith('board-id-123');
    });

    it('should throw ForbiddenException on delete if owner does not match', async () => {
      const existingBoard = {
        _id: 'board-id-123',
        title: 'Test Board',
        owner: { toString: () => 'other-user-id' },
      };
      mockExec.mockResolvedValue(existingBoard);

      await expect(
        boardsService.delete('board-id-123', 'user-id-123'),
      ).rejects.toThrow(ForbiddenException);

      expect(tasksService.deleteAllByBoard).not.toHaveBeenCalled();
    });
  });
});
