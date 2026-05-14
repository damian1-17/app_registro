// src/modules/qr/services/tipos-qr.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { TipoQr } from '../entities/tipo-qr.entity';
import {
  CreateTipoQrDto,
  UpdateTipoQrDto,
  TipoQrResponseDto,
  QueryTiposQrDto,
} from '../dto';

@Injectable()
export class TiposQrService {
  constructor(
    @InjectRepository(TipoQr, 'SEGURIDAD_DB')
    private readonly tipoQrRepository: Repository<TipoQr>,
  ) {}

  /**
   * Crear un nuevo tipo de QR
   */
  async create(dto: CreateTipoQrDto): Promise<TipoQrResponseDto> {
    const existe = await this.tipoQrRepository.findOne({
      where: { codigo: dto.codigo.toUpperCase() },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe un tipo de QR con el código "${dto.codigo}"`,
      );
    }

    const tipo = this.tipoQrRepository.create({
      ...dto,
      codigo: dto.codigo.toUpperCase(),
    });

    const saved = await this.tipoQrRepository.save(tipo);
    return this.toResponseDto(saved);
  }

  /**
   * Listar todos los tipos con búsqueda opcional
   */
  async findAll(query: QueryTiposQrDto): Promise<TipoQrResponseDto[]> {
    const { search } = query;
    const qb = this.tipoQrRepository.createQueryBuilder('t');

    if (search) {
      qb.where(
        '(t.nombre ILIKE :s OR t.codigo ILIKE :s OR t.descripcion ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    qb.orderBy('t.idTipoQr', 'ASC');

    const tipos = await qb.getMany();
    return tipos.map((t) => this.toResponseDto(t));
  }

  /**
   * Listar solo los tipos activos
   */
  async findActivos(): Promise<TipoQrResponseDto[]> {
    const tipos = await this.tipoQrRepository.find({
      where: { activo: true },
      order: { idTipoQr: 'ASC' },
    });
    return tipos.map((t) => this.toResponseDto(t));
  }

  /**
   * Obtener un tipo por ID
   */
  async findOne(id: number): Promise<TipoQrResponseDto> {
    const tipo = await this.tipoQrRepository.findOne({
      where: { idTipoQr: id },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo de QR con ID ${id} no encontrado`);
    }

    return this.toResponseDto(tipo);
  }

  /**
   * Actualizar un tipo de QR
   */
  async update(id: number, dto: UpdateTipoQrDto): Promise<TipoQrResponseDto> {
    const tipo = await this.tipoQrRepository.findOne({
      where: { idTipoQr: id },
    });

    if (!tipo) {
      throw new NotFoundException(`Tipo de QR con ID ${id} no encontrado`);
    }

    Object.assign(tipo, dto);
    const saved = await this.tipoQrRepository.save(tipo);
    return this.toResponseDto(saved);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toResponseDto(tipo: TipoQr): TipoQrResponseDto {
    return plainToInstance(TipoQrResponseDto, tipo, {
      excludeExtraneousValues: true,
    });
  }
}