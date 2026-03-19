import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  async create(createTaskDto: CreateTaskDto, boardId: string): Promise<TaskDocument> {
    const status = createTaskDto.status || TaskStatus.TODO;

    // Auto-assign position as max+1 in the same board+status
    const maxPositionTask = await this.taskModel
      .findOne({ board: boardId, status })
      .sort({ position: -1 })
      .exec();

    const position = createTaskDto.position ?? (maxPositionTask ? maxPositionTask.position + 1 : 0);

    const task = new this.taskModel({
      ...createTaskDto,
      status,
      position,
      board: boardId,
    });
    return task.save();
  }

  async findAllByBoard(boardId: string): Promise<TaskDocument[]> {
    return this.taskModel.find({ board: boardId }).sort({ status: 1, position: 1 }).exec();
  }

  async findById(id: string): Promise<TaskDocument> {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskDocument> {
    const task = await this.findById(id);

    // Handle status change with position recalculation
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      const maxPositionTask = await this.taskModel
        .findOne({ board: task.board, status: updateTaskDto.status })
        .sort({ position: -1 })
        .exec();

      if (updateTaskDto.position === undefined) {
        updateTaskDto.position = maxPositionTask ? maxPositionTask.position + 1 : 0;
      }
    }

    Object.assign(task, updateTaskDto);
    return task.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.taskModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Task not found');
    }
  }

  async deleteAllByBoard(boardId: string): Promise<void> {
    await this.taskModel.deleteMany({ board: boardId }).exec();
  }

  async reorder(
    boardId: string,
    tasks: { id: string; status: TaskStatus; position: number }[],
  ): Promise<void> {
    const bulkOps = tasks.map((item) => ({
      updateOne: {
        filter: { _id: item.id, board: boardId },
        update: { $set: { status: item.status, position: item.position } },
      },
    }));
    await this.taskModel.bulkWrite(bulkOps);
  }
}
