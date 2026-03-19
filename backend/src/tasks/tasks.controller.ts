import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BoardsService } from '../boards/boards.service';
import { TaskStatus } from './task.schema';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly boardsService: BoardsService,
  ) {}

  private async verifyBoardOwnership(boardId: string, userId: string): Promise<void> {
    const board = await this.boardsService.findById(boardId);
    if (board.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this board');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task in a board' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Param('boardId') boardId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    return this.tasksService.create(createTaskDto, boardId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks for a board' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async findAll(
    @Param('boardId') boardId: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    return this.tasksService.findAllByBoard(boardId);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiResponse({ status: 200, description: 'Task found' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async findOne(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    return this.tasksService.findById(taskId);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update a task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    return this.tasksService.update(taskId, updateTaskDto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    await this.tasksService.delete(taskId);
    return { message: 'Task deleted successfully' };
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder tasks (drag-and-drop)' })
  @ApiResponse({ status: 200, description: 'Tasks reordered successfully' })
  async reorder(
    @Param('boardId') boardId: string,
    @Body() body: { tasks: { id: string; status: TaskStatus; position: number }[] },
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.verifyBoardOwnership(boardId, user.userId);
    await this.tasksService.reorder(boardId, body.tasks);
    return { message: 'Tasks reordered successfully' };
  }
}
