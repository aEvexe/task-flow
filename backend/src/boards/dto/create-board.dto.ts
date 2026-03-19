import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'My Project Board' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Board for managing project tasks', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
