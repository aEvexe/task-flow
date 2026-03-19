import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { TaskStatus } from '../task.schema';

export class CreateTaskDto {
  @ApiProperty({ example: 'Implement login page' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Create the login form with validation', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus, required: false, default: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  position?: number;

  @ApiProperty({ example: '2026-03-25', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
