import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Board, BoardDocument } from './board.schema';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { TasksService } from '../tasks/tasks.service';

@Injectable()
export class BoardsService {
  constructor(
    @InjectModel(Board.name) private boardModel: Model<BoardDocument>,
    @Inject(forwardRef(() => TasksService))
    private readonly tasksService: TasksService,
  ) {}

  async create(createBoardDto: CreateBoardDto, userId: string): Promise<BoardDocument> {
    const board = new this.boardModel({
      ...createBoardDto,
      owner: userId,
    });
    return board.save();
  }

  async findAllByUser(userId: string): Promise<BoardDocument[]> {
    return this.boardModel.find({ owner: userId }).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<BoardDocument> {
    const board = await this.boardModel.findById(id).exec();
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string): Promise<BoardDocument> {
    const board = await this.findById(id);
    if (board.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this board');
    }
    Object.assign(board, updateBoardDto);
    return board.save();
  }

  async delete(id: string, userId: string): Promise<void> {
    const board = await this.findById(id);
    if (board.owner.toString() !== userId) {
      throw new ForbiddenException('You do not own this board');
    }
    await this.tasksService.deleteAllByBoard(id);
    await this.boardModel.findByIdAndDelete(id).exec();
  }
}
