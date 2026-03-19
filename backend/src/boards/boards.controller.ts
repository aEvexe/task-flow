import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  async create(
    @Body() createBoardDto: CreateBoardDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.boardsService.create(createBoardDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all boards for the current user' })
  @ApiResponse({ status: 200, description: 'List of boards' })
  async findAll(@CurrentUser() user: { userId: string; email: string }) {
    return this.boardsService.findAllByUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a board by ID' })
  @ApiResponse({ status: 200, description: 'Board found' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async findOne(@Param('id') id: string) {
    return this.boardsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a board' })
  @ApiResponse({ status: 200, description: 'Board updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    return this.boardsService.update(id, updateBoardDto, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a board' })
  @ApiResponse({ status: 200, description: 'Board deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; email: string },
  ) {
    await this.boardsService.delete(id, user.userId);
    return { message: 'Board deleted successfully' };
  }
}
