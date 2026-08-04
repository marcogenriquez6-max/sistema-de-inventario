import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, MoveTaskDto, UpdateTaskDto } from './dto/task.dto';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';

@ApiTags('Tareas')
@RequireModule('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar tareas (filtros por estado, asignado, búsqueda)',
  })
  list(
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('q') q?: string,
  ) {
    return this.tasks.list(
      status,
      assigneeId !== undefined ? parseInt(assigneeId, 10) : undefined,
      q,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear tarea' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasks.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tarea' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Mover tarea a otra columna (drag & drop)' })
  move(@Param('id', ParseIntPipe) id: number, @Body() dto: MoveTaskDto) {
    return this.tasks.move(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tarea' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tasks.remove(id);
    return { ok: true };
  }
}
