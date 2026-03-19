import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './task.schema';

describe('TasksService', () => {
  let tasksService: TasksService;

  const mockTaskModel = jest.fn();
  const mockSave = jest.fn();
  const mockExec = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    mockTaskModel.mockImplementation((data: Record<string, unknown>) => ({
      ...data,
      save: mockSave,
    }));

    mockTaskModel.findOne = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    mockTaskModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({ exec: mockExec }),
    });
    mockTaskModel.findById = jest.fn().mockReturnValue({ exec: mockExec });
    mockTaskModel.findByIdAndDelete = jest.fn().mockReturnValue({ exec: mockExec });
    mockTaskModel.deleteMany = jest.fn().mockReturnValue({ exec: jest.fn() });
    mockTaskModel.bulkWrite = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task with auto-positioned value', async () => {
      const createTaskDto = { title: 'Test Task' };
      const boardId = 'board-id-123';

      // Mock: there's already a task at position 2
      mockExec.mockResolvedValueOnce({ position: 2 });

      const savedTask = {
        _id: 'task-id-123',
        title: 'Test Task',
        status: TaskStatus.TODO,
        position: 3,
        board: boardId,
      };
      mockSave.mockResolvedValue(savedTask);

      const result = await tasksService.create(createTaskDto, boardId);

      expect(mockTaskModel.findOne).toHaveBeenCalledWith({
        board: boardId,
        status: TaskStatus.TODO,
      });
      expect(mockTaskModel).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          status: TaskStatus.TODO,
          position: 3,
          board: boardId,
        }),
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedTask);
    });

    it('should create a task at position 0 when no existing tasks', async () => {
      const createTaskDto = { title: 'First Task' };
      const boardId = 'board-id-123';

      mockExec.mockResolvedValueOnce(null); // no existing tasks

      const savedTask = {
        _id: 'task-id-1',
        title: 'First Task',
        status: TaskStatus.TODO,
        position: 0,
        board: boardId,
      };
      mockSave.mockResolvedValue(savedTask);

      const result = await tasksService.create(createTaskDto, boardId);

      expect(mockTaskModel).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 0,
        }),
      );
      expect(result).toEqual(savedTask);
    });

    it('should use explicitly provided position', async () => {
      const createTaskDto = { title: 'Task', position: 5 };
      const boardId = 'board-id-123';

      mockExec.mockResolvedValueOnce({ position: 10 }); // max existing

      const savedTask = {
        _id: 'task-id-1',
        title: 'Task',
        status: TaskStatus.TODO,
        position: 5,
        board: boardId,
      };
      mockSave.mockResolvedValue(savedTask);

      const result = await tasksService.create(createTaskDto, boardId);

      expect(mockTaskModel).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 5,
        }),
      );
      expect(result).toEqual(savedTask);
    });
  });

  describe('findAllByBoard', () => {
    it('should find all tasks by board', async () => {
      const boardId = 'board-id-123';
      const tasks = [
        { _id: 'task-1', title: 'Task 1', board: boardId, position: 0 },
        { _id: 'task-2', title: 'Task 2', board: boardId, position: 1 },
      ];
      mockExec.mockResolvedValue(tasks);

      const result = await tasksService.findAllByBoard(boardId);

      expect(mockTaskModel.find).toHaveBeenCalledWith({ board: boardId });
      expect(result).toEqual(tasks);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const existingTask = {
        _id: 'task-id-123',
        title: 'Old Title',
        status: TaskStatus.TODO,
        board: 'board-id-123',
        save: jest.fn(),
      };
      existingTask.save.mockResolvedValue({
        ...existingTask,
        title: 'New Title',
      });
      mockExec.mockResolvedValue(existingTask);

      const result = await tasksService.update('task-id-123', {
        title: 'New Title',
      });

      expect(mockTaskModel.findById).toHaveBeenCalledWith('task-id-123');
      expect(existingTask.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when task not found', async () => {
      mockExec.mockResolvedValue(null);

      await expect(
        tasksService.update('nonexistent', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      mockExec.mockResolvedValue({ _id: 'task-id-123' });

      await tasksService.delete('task-id-123');

      expect(mockTaskModel.findByIdAndDelete).toHaveBeenCalledWith('task-id-123');
    });

    it('should throw NotFoundException when deleting nonexistent task', async () => {
      mockExec.mockResolvedValue(null);

      await expect(tasksService.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAllByBoard', () => {
    it('should delete all tasks for a board', async () => {
      await tasksService.deleteAllByBoard('board-id-123');

      expect(mockTaskModel.deleteMany).toHaveBeenCalledWith({
        board: 'board-id-123',
      });
    });
  });
});
