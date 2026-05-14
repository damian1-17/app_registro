// src/modules/qr/services/usuarios-qr.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { Usuario } from '@/modules/auth/entities/usuario.entity';
import { AsignarQrARolDto } from '@/modules/qr/dto/asignar-qr-a-rol.dto';
import { UsuarioQr, EstadoQr } from '../entities/usuario-qr.entity';
import { TipoQr } from '../entities/tipo-qr.entity';
import {
  AsignarQrDto,
  AsignarTodosQrDto,
  AsignarQrLoteDto,
  CancelarQrDto,
  EscanearQrDto,
  UsuarioQrResponseDto,
  ResultadoEscaneoDto,
  QueryUsuarioQrDto,
  TipoQrResponseDto,
} from '../dto';
import { Rol } from '@/modules/auth/entities/rol.entity'; 

@Injectable()
export class UsuariosQrService {
  constructor(
    @InjectRepository(UsuarioQr, 'SEGURIDAD_DB')
    private readonly usuarioQrRepository: Repository<UsuarioQr>,

    @InjectRepository(TipoQr, 'SEGURIDAD_DB')
    private readonly tipoQrRepository: Repository<TipoQr>,
    @InjectRepository(Usuario, 'SEGURIDAD_DB')
    private readonly usuarioRepository: Repository<Usuario>,
  ) { }



  // ... métodos existentes sin cambios ...

  /**
   * Asigna un tipo de QR específico a TODOS los usuarios con rol 'user'.
   * Omite silenciosamente a quienes ya lo tengan asignado.
   */

  async asignarQrARolUser(dto: AsignarQrARolDto): Promise<{
    asignados: number;
    omitidos: number;
    detalle: UsuarioQrResponseDto[];
  }> {
    const ROL_USER = 'user'; // ← nombre exacto en tabla roles

    const tipo = await this.validarTipoQr(dto.idTipoQr);

    // ── JOIN a través de la tabla pivote usuarios_roles ──────
    const usuarios = await this.usuarioRepository
      .createQueryBuilder('u')
      .innerJoin('u.roles', 'r')          // JOIN usuarios_roles + roles
      .where('r.nombre = :rol', { rol: ROL_USER })
      .andWhere('u.estado = :estado', { estado: 'activo' })
      .select(['u.idUsuario'])             // solo lo que necesitamos
      .getMany();

    if (!usuarios.length) {
      throw new NotFoundException(
        `No se encontraron usuarios activos con rol '${ROL_USER}'`,
      );
    }

    let asignados = 0;
    let omitidos = 0;
    const detalle: UsuarioQrResponseDto[] = [];

    for (const usuario of usuarios) {
      const yaExiste = await this.usuarioQrRepository.findOne({
        where: {
          idUsuario: usuario.idUsuario,
          idTipoQr: tipo.idTipoQr,
          activo: true,
        },
      });

      if (yaExiste) {
        omitidos++;
        continue;
      }

      const nuevoQr = this.usuarioQrRepository.create({
        idUsuario: usuario.idUsuario,
        tipoQr: tipo,
        token: uuidv4(),
        estado: EstadoQr.ACTIVO,
        expiracion: dto.expiracion ? new Date(dto.expiracion) : undefined,
      });

      const saved = await this.usuarioQrRepository.save(nuevoQr);
      detalle.push(this.toResponseDto(await this.recargar(saved.idUsuarioQr)));
      asignados++;
    }

    return { asignados, omitidos, detalle };
  }


  // ─── Asignación ─────────────────────────────────────────────────────────────

  /**
   * Asignar un tipo de QR específico a un usuario.
   *
   * NOTA: idTipoQr en la entity tiene { insert: false, update: false }
   * porque la FK la gestiona la relación @ManyToOne(tipoQr).
   * Por eso pasamos el objeto TipoQr completo en lugar del número plano.
   * TypeORM extrae el id_tipo_qr de la relación al persistir.
   */
  async asignarQr(dto: AsignarQrDto): Promise<UsuarioQrResponseDto> {
    const tipo = await this.validarTipoQr(dto.idTipoQr);
    await this.verificarNoExiste(dto.idUsuario, dto.idTipoQr);

    const nuevoQr = this.usuarioQrRepository.create({
      idUsuario: dto.idUsuario,
      tipoQr: tipo,                                           // ← objeto completo
      token: uuidv4(),
      estado: EstadoQr.ACTIVO,
      expiracion: dto.expiracion ? new Date(dto.expiracion) : undefined,
    });

    const saved = await this.usuarioQrRepository.save(nuevoQr);
    // Recargamos para tener tipoQr hidratado igual que en findOne
    return this.toResponseDto(await this.recargar(saved.idUsuarioQr));
  }

  /**
   * Asignar todos los tipos de QR activos a un usuario.
   */
  async asignarTodosQr(dto: AsignarTodosQrDto): Promise<UsuarioQrResponseDto[]> {
    const tipos = await this.tipoQrRepository.find({ where: { activo: true } });

    if (!tipos.length) {
      throw new NotFoundException('No hay tipos de QR activos configurados');
    }

    const resultados: UsuarioQrResponseDto[] = [];

    for (const tipo of tipos) {
      const yaExiste = await this.usuarioQrRepository.findOne({
        where: { idUsuario: dto.idUsuario, idTipoQr: tipo.idTipoQr, activo: true },
      });

      if (yaExiste) continue;

      const nuevoQr = this.usuarioQrRepository.create({
        idUsuario: dto.idUsuario,
        tipoQr: tipo,
        token: uuidv4(),
        estado: EstadoQr.ACTIVO,
        expiracion: dto.expiracion ? new Date(dto.expiracion) : undefined,
      });

      const saved = await this.usuarioQrRepository.save(nuevoQr);
      resultados.push(this.toResponseDto(await this.recargar(saved.idUsuarioQr)));
    }

    return resultados;
  }

  /**
   * Asignar QRs en lote: N usuarios × N tipos.
   */
  async asignarQrLote(dto: AsignarQrLoteDto): Promise<{
    asignados: number;
    omitidos: number;
    detalle: UsuarioQrResponseDto[];
  }> {
    const tipos = await this.tipoQrRepository.find({
      where: { idTipoQr: In(dto.idTiposQr), activo: true },
    });

    if (tipos.length !== dto.idTiposQr.length) {
      throw new BadRequestException(
        'Uno o más tipos de QR no existen o están inactivos',
      );
    }

    // Mapa para lookup rápido
    const tipoMap = new Map<number, TipoQr>(
      tipos.map((t) => [t.idTipoQr, t]),
    );

    let asignados = 0;
    let omitidos = 0;
    const detalle: UsuarioQrResponseDto[] = [];

    for (const idUsuario of dto.idUsuarios) {
      for (const idTipoQr of dto.idTiposQr) {
        const yaExiste = await this.usuarioQrRepository.findOne({
          where: { idUsuario, idTipoQr, activo: true },
        });

        if (yaExiste) {
          omitidos++;
          continue;
        }

        const nuevoQr = this.usuarioQrRepository.create({
          idUsuario,
          tipoQr: tipoMap.get(idTipoQr)!,
          token: uuidv4(),
          estado: EstadoQr.ACTIVO,
          expiracion: dto.expiracion ? new Date(dto.expiracion) : undefined,
        });

        const saved = await this.usuarioQrRepository.save(nuevoQr);
        detalle.push(this.toResponseDto(await this.recargar(saved.idUsuarioQr)));
        asignados++;
      }
    }

    return { asignados, omitidos, detalle };
  }

  // ─── Consultas ──────────────────────────────────────────────────────────────

  async findByUsuario(idUsuario: number): Promise<UsuarioQrResponseDto[]> {
    const qrs = await this.usuarioQrRepository.find({
      where: { idUsuario, activo: true },
      relations: ['tipoQr'],
      order: { createdAt: 'ASC' },
    });

    return qrs.map((q) => this.toResponseDto(q));
  }

  async findAll(query: QueryUsuarioQrDto): Promise<UsuarioQrResponseDto[]> {
    const qb = this.usuarioQrRepository
      .createQueryBuilder('uqr')
      .leftJoinAndSelect('uqr.tipoQr', 'tipo')
      .where('uqr.activo = true');

    if (query.idUsuario) {
      qb.andWhere('uqr.idUsuario = :idUsuario', { idUsuario: query.idUsuario });
    }
    if (query.idTipoQr) {
      qb.andWhere('uqr.idTipoQr = :idTipoQr', { idTipoQr: query.idTipoQr });
    }
    if (query.estado) {
      qb.andWhere('uqr.estado = :estado', { estado: query.estado });
    }

    qb.orderBy('uqr.createdAt', 'DESC');

    const qrs = await qb.getMany();
    return qrs.map((q) => this.toResponseDto(q));
  }

  async findByToken(token: string): Promise<UsuarioQrResponseDto> {
    const qr = await this.usuarioQrRepository.findOne({
      where: { token, activo: true },
      relations: ['tipoQr'],
    });

    if (!qr) throw new NotFoundException('QR no encontrado');

    return this.toResponseDto(qr);
  }

  // ─── Escaneo (staff) ─────────────────────────────────────────────────────────

  async escanearQr(dto: EscanearQrDto): Promise<ResultadoEscaneoDto> {
    const qr = await this.usuarioQrRepository.findOne({
      where: { token: dto.token },
      relations: ['tipoQr'],
    });

    if (!qr || !qr.activo) {
      return this.resultadoInvalido('QR no válido o no encontrado');
    }

    if (qr.usado || qr.estado === EstadoQr.USADO) {
      return {
        valido: false,
        mensaje: `QR ya utilizado el ${qr.fechaUso?.toLocaleString('es-EC')}`,
        idUsuarioQr: qr.idUsuarioQr,
        idUsuario: qr.idUsuario,
        estado: qr.estado,
        fechaUso: qr.fechaUso ?? undefined,
        tipoQr: plainToInstance(TipoQrResponseDto, qr.tipoQr, {
          excludeExtraneousValues: true,
        }),
      };
    }

    if (qr.estado === EstadoQr.CANCELADO) {
      return this.resultadoInvalido('QR cancelado');
    }

    if (qr.expiracion && new Date() > qr.expiracion) {
      qr.estado = EstadoQr.EXPIRADO;
      await this.usuarioQrRepository.save(qr);
      return this.resultadoInvalido('QR expirado');
    }

    if (qr.tipoQr.requiereUnicoUso) {
      qr.usado = true;
      qr.estado = EstadoQr.USADO;
      qr.fechaUso = new Date();
      await this.usuarioQrRepository.save(qr);
    }

    return {
      valido: true,
      mensaje: `QR válido ✓ — ${qr.tipoQr.nombre}`,
      idUsuarioQr: qr.idUsuarioQr,
      idUsuario: qr.idUsuario,
      estado: qr.estado,
      fechaUso: qr.fechaUso ?? undefined,
      tipoQr: plainToInstance(TipoQrResponseDto, qr.tipoQr, {
        excludeExtraneousValues: true,
      }),
    };
  }

  // ─── Cancelar ────────────────────────────────────────────────────────────────

  async cancelarQr(dto: CancelarQrDto): Promise<UsuarioQrResponseDto> {
    const qr = await this.usuarioQrRepository.findOne({
      where: { idUsuarioQr: dto.idUsuarioQr },
      relations: ['tipoQr'],
    });

    if (!qr) throw new NotFoundException('QR no encontrado');

    qr.estado = EstadoQr.CANCELADO;
    qr.activo = false;
    const saved = await this.usuarioQrRepository.save(qr);
    return this.toResponseDto(saved);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Valida que el tipo exista y esté activo, retorna la entidad para reutilizarla */
  private async validarTipoQr(idTipoQr: number): Promise<TipoQr> {
    const tipo = await this.tipoQrRepository.findOne({
      where: { idTipoQr, activo: true },
    });

    if (!tipo) {
      throw new NotFoundException(
        `Tipo de QR con ID ${idTipoQr} no encontrado o inactivo`,
      );
    }

    return tipo;
  }

  private async verificarNoExiste(idUsuario: number, idTipoQr: number): Promise<void> {
    const existente = await this.usuarioQrRepository.findOne({
      where: { idUsuario, idTipoQr, activo: true },
    });

    if (existente) {
      throw new ConflictException(
        `El usuario ${idUsuario} ya tiene asignado este tipo de QR`,
      );
    }
  }

  /** Recarga el registro desde BD para garantizar que tipoQr esté hidratado */
  private async recargar(idUsuarioQr: string): Promise<UsuarioQr> {
    const qr = await this.usuarioQrRepository.findOne({
      where: { idUsuarioQr },
      relations: ['tipoQr'],
    });

    if (!qr) throw new NotFoundException('Error al recargar QR persistido');

    return qr;
  }

  private resultadoInvalido(mensaje: string): ResultadoEscaneoDto {
    return { valido: false, mensaje };
  }

  private toResponseDto(qr: UsuarioQr): UsuarioQrResponseDto {
    return plainToInstance(UsuarioQrResponseDto, qr, {
      excludeExtraneousValues: true,
    });
  }
}