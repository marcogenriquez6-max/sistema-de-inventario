import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Preparar pedido #45' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['todo', 'doing', 'done'] })
  @IsIn(['todo', 'doing', 'done'])
  status: TaskStatus;

  @ApiProperty({ enum: ['low', 'medium', 'high'], default: 'medium' })
  @IsIn(['low', 'medium', 'high'])
  priority: TaskPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @ApiProperty({ required: false, example: '2026-08-10' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateTaskDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: ['todo', 'doing', 'done'] })
  @IsOptional()
  @IsIn(['todo', 'doing', 'done'])
  status?: TaskStatus;

  @ApiProperty({ required: false, enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  priority?: TaskPriority;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  assigneeId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  boardOrder?: number;
}

export class MoveTaskDto {
  @ApiProperty({ enum: ['todo', 'doing', 'done'] })
  @IsIn(['todo', 'doing', 'done'])
  status: TaskStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  boardOrder?: number;
}
