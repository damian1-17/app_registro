import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Auditoria, AccionAuditoria } from '../entities/auditoria.entity';
import { CreateAuditoriaDto } from '../dtos/create-auditoria.dto';
import { FilterAuditoriaDto } from '../dtos/filter-auditoria.dto';

@Injectable()
export class AuditoriaService {
    constructor(
        @InjectRepository(Auditoria, 'PEDIDOS_DB')
        private readonly auditoriaRepository: Repository<Auditoria>,

    ) { }

    /**
     * Registrar una acción en la auditoría
     */
    async registrar(createAuditoriaDto: CreateAuditoriaDto): Promise<void> {
        try {

            const base = {
                entidad: createAuditoriaDto.entidad,
                idEntidad: String(createAuditoriaDto.idEntidad),
                accion: createAuditoriaDto.accion,
                usuarioId: createAuditoriaDto.usuarioId,
                usuarioEmail: createAuditoriaDto.usuarioEmail,
                datosAnteriores: createAuditoriaDto.datosAnteriores,
                datosNuevos: createAuditoriaDto.datosNuevos,
                ip: createAuditoriaDto.ip,
                userAgent: createAuditoriaDto.userAgent,
                detalles: createAuditoriaDto.detalles,
            };

            // Filtrar undefined
            const cleanData = Object.fromEntries(
                Object.entries(base).filter(([_, v]) => v !== undefined)
            );

            const auditoria = this.auditoriaRepository.create(cleanData);

            await this.auditoriaRepository.save(auditoria);

        } catch (error) {
            console.error('Error registrando auditoría:', error);
        }
    }

    /**
     * Buscar registros de auditoría con filtros
     */
    async findAll(filters: FilterAuditoriaDto) {
        const { entidad, idEntidad, accion, usuarioId, fechaDesde, fechaHasta, page, limit } = filters;

        const where: FindOptionsWhere<Auditoria> = {};

        if (entidad) {
            where.entidad = entidad;
        }

        if (idEntidad) {
            where.idEntidad = idEntidad;
        }

        if (accion) {
            where.accion = accion;
        }

        if (usuarioId) {
            where.usuarioId = usuarioId;
        }

        if (fechaDesde && fechaHasta) {
            where.fecha = Between(new Date(fechaDesde), new Date(fechaHasta));
        }


        if (!page || page <= 0) {
            throw new BadRequestException('La página debe ser un número positivo mayor que cero');
        }

        if (!limit || limit <= 0) {
            throw new BadRequestException('El límite debe ser un número positivo mayor que cero');
        }


        const skip = (page - 1) * limit;

        const [registros, total] = await this.auditoriaRepository.findAndCount({
            where,
            order: { fecha: 'DESC' },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: registros,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * Obtener historial de una entidad específica
     */
    async getHistorial(entidad: string, idEntidad: string | number) {
        return this.auditoriaRepository.find({
            where: {
                entidad,
                idEntidad: String(idEntidad),
            },
            order: { fecha: 'DESC' },
        });
    }

    /**
     * Obtener estadísticas de auditoría
     */
    async getEstadisticas(fechaDesde?: string, fechaHasta?: string) {
        const where: FindOptionsWhere<Auditoria> = {};

        if (fechaDesde && fechaHasta) {
            where.fecha = Between(new Date(fechaDesde), new Date(fechaHasta));
        }

        const total = await this.auditoriaRepository.count({ where });

        const porAccion = await this.auditoriaRepository
            .createQueryBuilder('auditoria')
            .select('auditoria.accion', 'accion')
            .addSelect('COUNT(*)', 'total')
            .where(fechaDesde && fechaHasta ? 'auditoria.fecha BETWEEN :fechaDesde AND :fechaHasta' : '1=1', {
                fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
                fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
            })
            .groupBy('auditoria.accion')
            .getRawMany();

        const porEntidad = await this.auditoriaRepository
            .createQueryBuilder('auditoria')
            .select('auditoria.entidad', 'entidad')
            .addSelect('COUNT(*)', 'total')
            .where(fechaDesde && fechaHasta ? 'auditoria.fecha BETWEEN :fechaDesde AND :fechaHasta' : '1=1', {
                fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
                fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
            })
            .groupBy('auditoria.entidad')
            .getRawMany();

        const usuariosActivos = await this.auditoriaRepository
            .createQueryBuilder('auditoria')
            .select('COUNT(DISTINCT auditoria.usuario_id)', 'total')
            .where('auditoria.usuario_id IS NOT NULL')
            .andWhere(fechaDesde && fechaHasta ? 'auditoria.fecha BETWEEN :fechaDesde AND :fechaHasta' : '1=1', {
                fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
                fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
            })
            .getRawOne();

        return {
            total,
            porAccion,
            porEntidad,
            usuariosActivos: Number(usuariosActivos?.total || 0),
        };
    }
}