// src/modules/pedidos/services/pedidos.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException // ✅ Agregar
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, DataSource } from 'typeorm'; // ✅ Agregar DataSource
import { Pedido, EstadoPedido } from '../entities/pedido.entity';
import { PedidoDetalle } from '../entities/pedido-detalle.entity';
import { CreatePedidoDto } from '../dtos/create-pedido.dto';
import { UpdatePedidoEstadoDto } from '../dtos/update-pedido-estado.dto';
import { FilterPedidoDto } from '../dtos/filter-pedido.dto';
import { ProductosService } from '@/modules/productos/services/productos.service';

import { UpdatePedidoDto } from '../dtos/update-pedido.dto';

import { AuditoriaService } from '@/modules/auditoria/services/auditoria.service';
import { AccionAuditoria } from '@/modules/auditoria/entities/auditoria.entity';
import { Usuario } from '@/modules/auth/entities';

import {
  PedidoResponseDto,
  PaginatedPedidosResponseDto,
  PedidoDetalleResponseDto
} from '../dtos/response/pedido-response.dto';
import { plainToClass } from 'class-transformer';
import { privateDecrypt } from 'crypto';



//FACTURACION

import { EventEmitter2 } from '@nestjs/event-emitter'; // ← NUEVO
import { PedidoAprobadoEvent } from '../../facturacion/events/pedido-aprobado.event'; // ← NUEVO




@Injectable()
export class PedidosService {
  constructor(

    @InjectRepository(Pedido, 'PEDIDOS_DB')
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(PedidoDetalle, 'PEDIDOS_DB')
    private readonly detalleRepository: Repository<PedidoDetalle>,

    @InjectRepository(Usuario, 'PEDIDOS_DB') // Inyectar el repositorio de usuarios
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly productosService: ProductosService,

    @InjectDataSource('PEDIDOS_DB') // ✅ AQUÍ
    private readonly dataSource: DataSource, // ✅ Inyectar DataSource

    private readonly auditoriaService: AuditoriaService, // ✅ Inyectar


    //FACTURACION
    private readonly eventEmitter: EventEmitter2, // ← NUEVO


  ) { }


  /**
   * NUEVO MÉTODO: Aprobar pedido y generar factura automáticamente
   */
  async aprobarPedido(idPedido: number, supervisorId: number): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { idPedido },
      relations: ['detalles'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido #${idPedido} no encontrado`);
    }

    if (pedido.estado === 'cancelado') {
      throw new BadRequestException('No se puede aprobar un pedido cancelado');
    }

    if (pedido.estado === 'confirmado') {
      throw new BadRequestException('El pedido ya está aprobado');
    }

    // Actualizar estado
    pedido.estado = EstadoPedido.CONFIRMADO;
    const pedidoActualizado = await this.pedidoRepository.save(pedido);

    // 🔥 EMITIR EVENTO para generación automática de factura
    const event = new PedidoAprobadoEvent(idPedido, supervisorId);
    this.eventEmitter.emit('pedido.aprobado', event);

    return pedidoActualizado;
  }


  //  MÉTODO CREATE TRANSACCIONAL
  // ✅ MÉTODO CREATE TRANSACCIONAL - CORREGIDO
  async create(idCliente: number, createPedidoDto: CreatePedidoDto): Promise<PedidoResponseDto> {
    const { detalles, metodoPago, direccion, observaciones, } = createPedidoDto;

    // Validar que todos los productos existen y están activos (ANTES de la transacción)
    const productosIds = detalles.map(d => d.idProducto);
    const productos = await this.productosService.findByIds(productosIds);

    if (productos.length !== productosIds.length) {
      throw new BadRequestException('Uno o más productos no existen');
    }

    // Validar que todos los productos están activos
    const productosInactivos = productos.filter(p => !p.activo);
    if (productosInactivos.length > 0) {
      throw new BadRequestException(
        `Los siguientes productos no están disponibles: ${productosInactivos.map(p => p.nombre).join(', ')}`
      );
    }



    // INICIAR TRANSACCIÓN
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {



      const cliente = await queryRunner.manager.findOne(Usuario,
        {
          where: { idUsuario: idCliente },
          select: ['cedula']
        });

      if (!cliente) {
        throw new BadRequestException(`Cliente con ID ${idCliente} no encontrado`);
      }
      // ✅ Crear objeto base
      const pedidoData: any = {
        idCliente,
        cedula: cliente.cedula,
        estado: EstadoPedido.PENDIENTE,
        total: 0,
        metodoPago,
      };

      // ✅ Solo agregar campos opcionales si tienen valor
      if (direccion) {
        pedidoData.direccion = direccion;
      }
      if (observaciones) {
        pedidoData.observaciones = observaciones;
      }




      // Crear el pedido
      const pedido = queryRunner.manager.create(Pedido, pedidoData);

      const pedidoGuardado = await queryRunner.manager.save(Pedido, pedido);

      // Crear los detalles y calcular el total
      let total = 0;
      const detallesCreados: PedidoDetalle[] = [];

      for (const detalleDto of detalles) {
        const producto = productos.find(p => p.idProducto === detalleDto.idProducto);

        if (!producto) {
          throw new BadRequestException(`Producto con ID ${detalleDto.idProducto} no encontrado`);
        }

        const precioUnitario = Number(producto.precio);
        const subtotal = precioUnitario * detalleDto.cantidad;

        const detalle = queryRunner.manager.create(PedidoDetalle, {
          idPedido: pedidoGuardado.idPedido,
          idProducto: detalleDto.idProducto,
          cantidad: detalleDto.cantidad,
          precioUnitario,
          subtotal,
        });

        const detalleGuardado = await queryRunner.manager.save(PedidoDetalle, detalle);
        detallesCreados.push(detalleGuardado);
        total += subtotal;
      }

      // Actualizar el total del pedido
      pedidoGuardado.total = total;
      await queryRunner.manager.save(Pedido, pedidoGuardado);

      // COMMIT - Si todo salió bien
      await queryRunner.commitTransaction();
      await this.auditoriaService.registrar({
        entidad: 'pedidos',
        idEntidad: pedidoGuardado.idPedido,
        accion: AccionAuditoria.CREAR,
        usuarioId: idCliente,
        datosNuevos: { ...pedidoGuardado, detalles: detallesCreados },
        detalles: `Pedido creado con ${detalles.length} productos. Total: $${total}`,
      });

      // Cargar el pedido completo con relaciones
      return this.findOne(pedidoGuardado.idPedido, idCliente);

    } catch (error) {
      // ROLLBACK - Si algo salió mal
      await queryRunner.rollbackTransaction();

      console.error('Error creando pedido:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al crear el pedido. Por favor, intenta nuevamente.'
      );
    } finally {
      // LIBERAR RECURSOS
      await queryRunner.release();
    }
  }

  // ✅ MÉTODO UPDATE TRANSACCIONAL (después del método create)
  async update(
    idPedido: number,
    updatePedidoDto: UpdatePedidoDto,
    idCliente: number,
    isAdmin: boolean = false,
  ): Promise<PedidoResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, {
        where: { idPedido },
        relations: ['cliente', 'detalles', 'detalles.producto'],
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
      }

      // Si no es admin, verificar que el pedido sea del cliente
      if (!isAdmin && pedido.idCliente !== idCliente) {
        throw new ForbiddenException('No tienes permiso para actualizar este pedido');
      }

      // Solo se pueden actualizar pedidos pendientes
      if (pedido.estado !== EstadoPedido.PENDIENTE) {
        throw new BadRequestException(
          `Solo se pueden actualizar pedidos en estado pendiente`
        );
      }

      // Actualizar campos
      if (updatePedidoDto.metodoPago !== undefined) {
        pedido.metodoPago = updatePedidoDto.metodoPago;
      }
      if (updatePedidoDto.direccion !== undefined) {
        pedido.direccion = updatePedidoDto.direccion;
      }
      if (updatePedidoDto.observaciones !== undefined) {
        pedido.observaciones = updatePedidoDto.observaciones;
      }

      await queryRunner.manager.save(Pedido, pedido);

      await queryRunner.commitTransaction();


      return this.mapToResponseDto(pedido);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al actualizar el pedido');
    } finally {
      await queryRunner.release();
    }
  }

  //  MÉTODO UPDATE ESTADO TRANSACCIONAL
  async updateEstado(
    idPedido: number,
    updateEstadoDto: UpdatePedidoEstadoDto,
  ): Promise<PedidoResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // Guardar estado anterior


    try {
      const pedido = await queryRunner.manager.findOne(Pedido, {
        where: { idPedido },
        relations: ['cliente', 'detalles', 'detalles.producto'],
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
      }
      const estadoAnterior = pedido.estado;

      // Validar transiciones de estado permitidas
      this.validarTransicionEstado(pedido.estado, updateEstadoDto.estado);

      pedido.estado = updateEstadoDto.estado;
      await queryRunner.manager.save(Pedido, pedido);

      await queryRunner.commitTransaction();


      // ✅ Registrar auditoría de cambio de estado
      await this.auditoriaService.registrar({
        entidad: 'pedidos',
        idEntidad: idPedido,
        accion: AccionAuditoria.CAMBIO_ESTADO,
        datosAnteriores: { estado: estadoAnterior },
        datosNuevos: { estado: updateEstadoDto.estado },
        detalles: `Estado cambiado de ${estadoAnterior} a ${updateEstadoDto.estado}`,
      });
      return this.mapToResponseDto(pedido);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al actualizar el estado del pedido');
    } finally {
      await queryRunner.release();
    }
  }

  // MÉTODO CANCELAR TRANSACCIONAL
  async cancelar(idPedido: number, idCliente: number, isAdmin: boolean = false): Promise<PedidoResponseDto> {





    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, {
        where: { idPedido },
        relations: ['cliente', 'detalles', 'detalles.producto'],
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
      }


      // Si no es admin, verificar que el pedido sea del cliente
      if (!isAdmin && pedido.idCliente !== idCliente) {
        throw new ForbiddenException('No tienes permiso para cancelar este pedido');
      }

      // Solo se pueden cancelar pedidos pendientes
      if (![EstadoPedido.PENDIENTE].includes(pedido.estado)) {
        throw new BadRequestException(
          `No se puede cancelar un pedido en estado ${pedido.estado}`
        );
      }

      pedido.estado = EstadoPedido.CANCELADO;
      await queryRunner.manager.save(Pedido, pedido);
      const estadoAnterior = pedido.estado;
      await queryRunner.commitTransaction();
      // ✅ Auditoría
      await this.auditoriaService.registrar({
        entidad: 'pedidos',
        idEntidad: idPedido,
        accion: AccionAuditoria.CAMBIO_ESTADO,
        usuarioId: idCliente,
        datosAnteriores: { estado: estadoAnterior },
        datosNuevos: { estado: EstadoPedido.CANCELADO },
        detalles: `Pedido cancelado por ${isAdmin ? 'administrador' : 'cliente'}`,
      });

      return this.mapToResponseDto(pedido);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al cancelar el pedido');
    } finally {
      await queryRunner.release();
    }
  }

  //  MÉTODO REMOVE TRANSACCIONAL
  async remove(idPedido: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pedido = await queryRunner.manager.findOne(Pedido, {
        where: { idPedido },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
      }

      // Solo se pueden eliminar pedidos cancelados
      if (pedido.estado !== EstadoPedido.CANCELADO) {
        throw new BadRequestException('Solo se pueden eliminar pedidos cancelados');
      }

      await queryRunner.manager.remove(Pedido, pedido);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Error al eliminar el pedido');
    } finally {
      await queryRunner.release();
    }
  }

  // Los demás métodos (findAll, findOne, getEstadisticas) NO necesitan transacciones
  // porque son solo de lectura

  async findAll(
    idCliente: number,
    filters: FilterPedidoDto,
    isAdmin: boolean = false,
  ): Promise<PaginatedPedidosResponseDto> {
    const { estado, fechaDesde, fechaHasta, page, limit, sortBy, sortOrder } = filters;

    const where: FindOptionsWhere<Pedido> = {};

    if (!isAdmin) {
      where.idCliente = idCliente;
    }

    if (estado) {
      where.estado = estado;
    }

    if (fechaDesde && fechaHasta) {
      where.fecha = Between(new Date(fechaDesde), new Date(fechaHasta));
    }

    if (fechaDesde && !fechaHasta) {
      where.fecha = Between(new Date(fechaDesde), new Date());
    }

    if (!limit || limit <= 0) {
      throw new BadRequestException('El límite debe ser un número positivo mayor que cero');
    }

    if (!page || page <= 0) {
      throw new BadRequestException('La página debe ser un número positivo mayor que cero');
    }

    const skip = (page - 1) * limit;

    // ✅ Hacer sortBy opcional con valor por defecto
    const orderBy = sortBy?.trim() || 'fecha';

    const [pedidos, total] = await this.pedidoRepository.findAndCount({
      where,
      relations: ['cliente', 'detalles', 'detalles.producto'],
      order: { [orderBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: pedidos.map(p => this.mapToResponseDto(p)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(idPedido: number, idCliente: number, isAdmin: boolean = false): Promise<PedidoResponseDto> {
    const pedido = await this.pedidoRepository.findOne({
      where: { idPedido },
      relations: ['cliente', 'detalles', 'detalles.producto'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
    }

    if (!isAdmin && pedido.idCliente !== idCliente) {
      throw new ForbiddenException('No tienes permiso para ver este pedido');
    }

    return this.mapToResponseDto(pedido);
  }

  async getEstadisticas(idCliente?: number) {
    const where: FindOptionsWhere<Pedido> = idCliente ? { idCliente } : {};

    const [total, pendientes, confirmados, enProceso, enviados, entregados, cancelados] = await Promise.all([
      this.pedidoRepository.count({ where }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.PENDIENTE } }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.CONFIRMADO } }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.EN_PROCESO } }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.ENVIADO } }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.ENTREGADO } }),
      this.pedidoRepository.count({ where: { ...where, estado: EstadoPedido.CANCELADO } }),
    ]);

    const totalVentas = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .select('SUM(pedido.total)', 'total')
      .where(idCliente ? 'pedido.id_cliente = :idCliente' : '1=1', { idCliente })
      .andWhere('pedido.estado != :estado', { estado: EstadoPedido.CANCELADO })
      .getRawOne();

    return {
      totalPedidos: total,
      porEstado: {
        pendientes,
        confirmados,
        enProceso,
        enviados,
        entregados,
        cancelados,
      },
      totalVentas: Number(totalVentas?.total || 0),
    };
  }

  private validarTransicionEstado(estadoActual: EstadoPedido, nuevoEstado: EstadoPedido): void {
    const transicionesPermitidas: Record<EstadoPedido, EstadoPedido[]> = {
      [EstadoPedido.PENDIENTE]: [EstadoPedido.CONFIRMADO, EstadoPedido.CANCELADO],
      [EstadoPedido.CONFIRMADO]: [EstadoPedido.EN_PROCESO, EstadoPedido.CANCELADO],
      [EstadoPedido.EN_PROCESO]: [EstadoPedido.ENVIADO],
      [EstadoPedido.ENVIADO]: [EstadoPedido.ENTREGADO],
      [EstadoPedido.ENTREGADO]: [],
      [EstadoPedido.CANCELADO]: [],
    };

    if (!transicionesPermitidas[estadoActual].includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`
      );
    }
  }

  private mapToResponseDto(pedido: Pedido): PedidoResponseDto {
    return plainToClass(
      PedidoResponseDto,
      {
        ...pedido,
        nombreCliente: pedido.cliente?.nombre,
        detalles: pedido.detalles?.map(d => ({
          ...d,
          nombreProducto: d.producto?.nombre,
        })),
      },
      { excludeExtraneousValues: true }
    );
  }
}