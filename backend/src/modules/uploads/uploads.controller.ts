import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Request } from 'express';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireModule } from '../../common/decorators/require-module.decorator';

const IMAGE_MIME: Record<string, boolean> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/gif': true,
  'image/avif': true,
};

@ApiTags('Subidas')
@RequireModule('catalog')
@Controller('uploads')
export class UploadsController {
  @Post()
  @Roles('ADMIN', 'INVENTORY_MANAGER', 'MANAGER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads');
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const safeExt = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${safeExt}`);
        },
      }),
      limits: { fileSize: 3 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!IMAGE_MIME[file.mimetype]) {
          return cb(
            new BadRequestException(
              'Solo se permiten imágenes (JPG, PNG, WebP, GIF, AVIF)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Subir una imagen y obtener su URL pública' })
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() _req: Request,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No se recibió el archivo');
    }
    return { url: `/api/uploads/${file.filename}` };
  }
}
