import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '../../config/config.service';

const SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadSecurityService {
  constructor(private readonly configService: ConfigService) {}

  async saveHseAutogestionFile(
    contratistaId: number,
    modulo: string,
    campo: string,
    archivo: UploadedFileLike,
  ) {
    this.validateUploadedFile(archivo);

    const moduloSeguro = this.validarSegmentoArchivo(modulo);
    const campoSeguro = this.validarSegmentoArchivo(campo);
    const ext = path.extname(archivo.originalname || '').toLowerCase();
    const nombreArchivo = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const relativePath = path.posix.join(
      'hse',
      String(contratistaId),
      moduloSeguro,
      campoSeguro,
      nombreArchivo,
    );
    const fullPath = this.resolveUploadPath(relativePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, archivo.buffer);

    return {
      modulo,
      campo,
      path: relativePath,
      filename: archivo.originalname,
      contentType: archivo.mimetype,
      sizeBytes: archivo.size,
    };
  }

  resolveUploadPath(relativePath: string) {
    const uploadRoot = path.resolve(this.configService.uploadDir);
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
    const fullPath = path.resolve(uploadRoot, normalized);
    const relativeToRoot = path.relative(uploadRoot, fullPath);

    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      throw new BadRequestException('Ruta de archivo invalida');
    }

    return fullPath;
  }

  private validateUploadedFile(archivo: UploadedFileLike) {
    const ext = path.extname(archivo.originalname || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    if (!ALLOWED_MIME_TYPES.has(archivo.mimetype)) {
      throw new BadRequestException('Contenido de archivo no permitido');
    }

    if (archivo.size > this.configService.maxUploadSizeBytes) {
      throw new BadRequestException(
        `El archivo supera el limite de ${this.configService.maxUploadSizeMb} MB`,
      );
    }
  }

  private validarSegmentoArchivo(value: string) {
    if (!value || !SEGMENT_REGEX.test(value)) {
      throw new BadRequestException('Ruta de archivo invalida');
    }
    return value;
  }
}
