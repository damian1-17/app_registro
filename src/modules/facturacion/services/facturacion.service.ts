import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Like, In } from 'typeorm';
import { Factura } from '@/modules/facturacion/entities/factura.entity';
import { DetalleFactura } from '@/modules/facturacion/entities/detalle-factura.entity';
import { Producto } from '@/modules/productos/entities/producto.entity';
import { CreateFacturaDto } from '../dtos/request/create-factura.dto';
import { UpdateFacturaDto } from '../dtos/request/update-factura.dto';
import { UploadEvidenciaDto } from '../dtos/upload-evidencia.dto';
import {
  FacturaResponseDto,
  PaginatedFacturasResponseDto,
} from '../dtos/response/factura-response.dto';
import { plainToClass } from 'class-transformer';
import { EstadoFactura, FACTURACION_CONSTANTS } from '../constants/facturacion.constants';
import { Usuario } from '@/modules/auth/entities';
import { PedidoDataParaFactura } from '../interfaces/pedido-data.interface';

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(Factura, 'FACTURACION_DB')
    private readonly facturaRepository: Repository<Factura>,

    @InjectRepository(DetalleFactura, 'FACTURACION_DB')
    private readonly detalleRepository: Repository<DetalleFactura>,

    @InjectRepository(Producto, 'PEDIDOS_DB')
    private readonly productoRepository: Repository<Producto>,

    @InjectRepository(Usuario, 'PEDIDOS_DB')
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectDataSource('FACTURACION_DB')
    private readonly facturacionDataSource: DataSource,
  ) { }

  // ─────────────────────────────────────────────
  // MÉTODOS PRIVADOS
  // ─────────────────────────────────────────────

  /**
   * Validar que el cliente exista, esté activo y tenga rol de cliente
   */
  private async validarCliente(idCliente: number): Promise<void> {
    const cliente = await this.usuarioRepository.findOne({
      where: { idUsuario: idCliente },
      relations: ['roles'],
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${idCliente} no encontrado`);
    }

    if (cliente.estado !== 'activo') {
      throw new BadRequestException(
        `El cliente ${cliente.nombre} no está activo (estado: ${cliente.estado})`,
      );
    }

    const esCliente = cliente.roles.some(
      (rol) => rol.nombre.toUpperCase() === 'CLIENTE',
    );

    if (!esCliente) {
      throw new BadRequestException(
        `El usuario ${cliente.nombre} no tiene rol de cliente`,
      );
    }
  }

  /**
   * Genera un número de factura único con el prefijo dado
   */
  private async generarNumeroFactura(prefijo: string): Promise<string> {
    const ultimaFactura = await this.facturaRepository.findOne({
      where: { numeroFactura: Like(`${prefijo}-%`) },
      order: { numeroFactura: 'DESC' },
    });

    let ultimoNumero = 0;

    if (ultimaFactura) {
      const match = ultimaFactura.numeroFactura.match(/\d+$/);
      ultimoNumero = match ? Number(match[0]) : 0;
    }

    const nuevoNumero = ultimoNumero + 1;
    return `${prefijo}-${nuevoNumero.toString().padStart(8, '0')}`;
  }

  /**
   * Calcula subtotal, IVA y total de la factura
   */
  private calcularTotales(
    detalles: { cantidad: number; precioUnitario: number; descuento?: number }[],
    descuentoGeneral: number = 0,
    porcentajeIva: number = FACTURACION_CONSTANTS.IVA_PORCENTAJE_DEFAULT,
  ) {
    const subtotal = detalles.reduce((sum, detalle) => {
      const descuentoDetalle = detalle.descuento || 0;
      const subtotalDetalle =
        detalle.cantidad * detalle.precioUnitario - descuentoDetalle;
      return sum + subtotalDetalle;
    }, 0);

    const subtotalConDescuento = subtotal - descuentoGeneral;
    const iva = (subtotalConDescuento * porcentajeIva) / 100;
    const total = subtotalConDescuento + iva;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  /**
   * Validar que todos los productos existan y estén activos (sin validación de stock)
   */
  private async validarProductos(
    detalles: Array<{
      idProducto: number;
      cantidad: number;
      nombreProducto?: string;
    }>,
  ): Promise<void> {
    const idsProductos = detalles.map((d) => d.idProducto);

    const productos = await this.productoRepository.find({
      where: { idProducto: In(idsProductos) },
    });

    if (productos.length !== idsProductos.length) {
      const productosEncontrados = productos.map((p) => p.idProducto);
      const productosFaltantes = idsProductos.filter(
        (id) => !productosEncontrados.includes(id),
      );
      throw new NotFoundException(
        `Productos no encontrados: ${productosFaltantes.join(', ')}`,
      );
    }

    const productosInactivos = productos.filter((p) => !p.activo);
    if (productosInactivos.length > 0) {
      const nombresInactivos = productosInactivos
        .map((p) => p.nombre)
        .join(', ');
      throw new BadRequestException(
        `Los siguientes productos no están disponibles: ${nombresInactivos}`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // MÉTODOS PÚBLICOS
  // ─────────────────────────────────────────────

  /**
   * RF-02: Crear factura directa (vendedor)
   * Una factura directa NO tiene idPedido asociado
   */
  async createFacturaDirecta(
    createFacturaDto: CreateFacturaDto,
    vendedorId: number,
  ): Promise<FacturaResponseDto> {
    const queryRunner = this.facturacionDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // ✅ Solo validar cliente si se proporcionó un idCliente
      if (createFacturaDto.idCliente) {
        await this.validarCliente(createFacturaDto.idCliente);
      }

      await this.validarProductos(createFacturaDto.detalles);

      const numeroFactura = await this.generarNumeroFactura('FAC-DIR');

      const { subtotal, iva, total } = this.calcularTotales(
        createFacturaDto.detalles,
        createFacturaDto.descuento || 0,
      );

      const factura = queryRunner.manager.create(Factura, {
        numeroFactura,
        idPedido: null,
        idCliente: createFacturaDto.idCliente ?? null, // ✅ null si no se proporcionó
        nombreCliente: createFacturaDto.nombreCliente,
        cedula: createFacturaDto.cedula,
        direccion: createFacturaDto.direccion ?? ' ',
        telefono: createFacturaDto.telefono ?? ' ',
        email: createFacturaDto.email ?? ' ',
        fechaEmision: new Date(),
        subtotal,
        descuento: createFacturaDto.descuento || 0,
        porcentajeIva: FACTURACION_CONSTANTS.IVA_PORCENTAJE_DEFAULT,
        iva,
        total,
        formaPago: createFacturaDto.formaPago,
        estado: FACTURACION_CONSTANTS.ESTADO_DEFAULT,
        observaciones:
          createFacturaDto.observaciones ||
          `Factura directa creada por vendedor #${vendedorId}`,
        latitud: createFacturaDto.latitud ?? null,
        longitud: createFacturaDto.longitud ?? null,
        fotoBase64: createFacturaDto.fotoBase64 ?? null,
      });

      const facturaGuardada = await queryRunner.manager.save(Factura, factura);

      const detallesCreados: DetalleFactura[] = [];

      for (const detalleDto of createFacturaDto.detalles) {
        const subtotalDetalle =
          detalleDto.cantidad * detalleDto.precioUnitario -
          (detalleDto.descuento || 0);

        const detalle = queryRunner.manager.create(DetalleFactura, {
          idFactura: facturaGuardada.idFactura,
          idProducto: detalleDto.idProducto,
          nombreProducto: detalleDto.nombreProducto,
          cantidad: detalleDto.cantidad,
          precioUnitario: detalleDto.precioUnitario,
          descuento: detalleDto.descuento || 0,
          subtotal: Number(subtotalDetalle.toFixed(2)),
        });

        const detalleGuardado = await queryRunner.manager.save(DetalleFactura, detalle);
        detallesCreados.push(detalleGuardado);
      }

      await queryRunner.commitTransaction();

      facturaGuardada.detalles = detallesCreados;
      return this.mapToResponseDto(facturaGuardada);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creando factura directa:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Error al crear la factura directa');
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * RF-01: Generar factura automática desde un pedido aprobado
   * Esta función se llamará desde el listener del evento.
   * NO incluye foto ni GPS porque es generada por el sistema.
   */
  async generarFacturaAutomatica(
    idPedido: number,
    pedidoData: PedidoDataParaFactura,
  ): Promise<FacturaResponseDto> {
    // Validar antes de abrir transacción
    const facturaExistente = await this.facturaRepository.findOne({
      where: { idPedido },
    });

    if (facturaExistente) {
      throw new BadRequestException(
        `El pedido #${idPedido} ya tiene una factura asociada: ${facturaExistente.numeroFactura}`,
      );
    }

    const queryRunner = this.facturacionDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const numeroFactura = await this.generarNumeroFactura('FAC-PED');

      const { subtotal, iva, total } = this.calcularTotales(pedidoData.detalles);

      const factura = queryRunner.manager.create(Factura, {
        numeroFactura,
        idPedido,
        idCliente: pedidoData.idCliente,
        nombreCliente: pedidoData.nombreCliente,
        cedula: pedidoData.cedula,
        direccion: pedidoData.direccion ?? ' ',
        telefono: pedidoData.telefono ?? ' ',
        email: pedidoData.email ?? ' ',
        fechaEmision: new Date(),
        subtotal,
        descuento: 0,
        porcentajeIva: FACTURACION_CONSTANTS.IVA_PORCENTAJE_DEFAULT,
        iva,
        total,
        formaPago: pedidoData.metodoPago,
        estado: FACTURACION_CONSTANTS.ESTADO_DEFAULT,
        observaciones: `[SISTEMA] Factura generada automáticamente desde pedido #${idPedido}`,
        fechaAutorizacion: new Date(),
        // GPS y foto no aplican en facturas automáticas
        latitud: null,
        longitud: null,
        fotoBase64: null,
      });

      const facturaGuardada = await queryRunner.manager.save(Factura, factura);

      const detallesCreados: DetalleFactura[] = [];

      for (const detalleDto of pedidoData.detalles) {
        const subtotalDetalle =
          detalleDto.cantidad * detalleDto.precioUnitario;

        const detalle = queryRunner.manager.create(DetalleFactura, {
          idFactura: facturaGuardada.idFactura,
          idProducto: detalleDto.idProducto,
          nombreProducto: detalleDto.nombreProducto,
          cantidad: detalleDto.cantidad,
          precioUnitario: detalleDto.precioUnitario,
          descuento: 0,
          subtotal: Number(subtotalDetalle.toFixed(2)),
        });

        const detalleGuardado = await queryRunner.manager.save(
          DetalleFactura,
          detalle,
        );
        detallesCreados.push(detalleGuardado);
      }

      await queryRunner.commitTransaction();

      facturaGuardada.detalles = detallesCreados;
      return this.mapToResponseDto(facturaGuardada);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al generar la factura automática',
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * RF-04: Consultar facturas con filtros opcionales y paginación
   */
  async findAll(
    idCliente?: number,
    filters?: {
      estado?: EstadoFactura;
      fechaDesde?: string;
      fechaHasta?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedFacturasResponseDto> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Factura> = {};

    if (idCliente) where.idCliente = idCliente;
    if (filters?.estado) where.estado = filters.estado;

    const [facturas, total] = await this.facturaRepository.findAndCount({
      where,
      relations: ['detalles'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: facturas.map((f) => this.mapToResponseDto(f)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * RF-04: Consultar una factura específica por ID
   */
  async findOne(
    idFactura: number,
    idCliente?: number,
  ): Promise<FacturaResponseDto> {
    const factura = await this.facturaRepository.findOne({
      where: { idFactura },
      relations: ['detalles'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${idFactura} no encontrada`);
    }

    // RF-07: Los clientes solo pueden ver sus propias facturas
    if (idCliente && factura.idCliente !== idCliente) {
      throw new ForbiddenException('No tienes permiso para ver esta factura');
    }

    return this.mapToResponseDto(factura);
  }

  /**
   * Obtener facturas asociadas a un pedido
   */
  async findByPedido(idPedido: number): Promise<FacturaResponseDto[]> {
    const facturas = await this.facturaRepository.find({
      where: { idPedido },
      relations: ['detalles'],
      order: { fechaEmision: 'DESC' },
    });

    return facturas.map((f) => this.mapToResponseDto(f));
  }

  /**
   * Actualizar estado y observaciones de una factura (vendedores/supervisores)
   */
  async updateEstado(
    idFactura: number,
    updateFacturaDto: UpdateFacturaDto,
  ): Promise<FacturaResponseDto> {
    const factura = await this.facturaRepository.findOne({
      where: { idFactura },
      relations: ['detalles'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${idFactura} no encontrada`);
    }

    if (factura.estado === EstadoFactura.ANULADA) {
      throw new BadRequestException(
        'No se puede modificar una factura anulada',
      );
    }

    if (updateFacturaDto.estado) {
      factura.estado = updateFacturaDto.estado;
    }

    if (updateFacturaDto.observaciones !== undefined) {
      factura.observaciones = updateFacturaDto.observaciones;
    }

    if (updateFacturaDto.latitud !== undefined) {
      factura.latitud = updateFacturaDto.latitud;
    }

    if (updateFacturaDto.longitud !== undefined) {
      factura.longitud = updateFacturaDto.longitud;
    }

    if (updateFacturaDto.fotoBase64 !== undefined) {
      factura.fotoBase64 = updateFacturaDto.fotoBase64;
    }

    const facturaActualizada = await this.facturaRepository.save(factura);
    return this.mapToResponseDto(facturaActualizada);
  }

  /**
   * Obtener factura por número de factura
   */
  async findByNumero(numeroFactura: string): Promise<FacturaResponseDto> {
    const factura = await this.facturaRepository.findOne({
      where: { numeroFactura },
      relations: ['detalles'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura ${numeroFactura} no encontrada`);
    }

    return this.mapToResponseDto(factura);
  }

  /**
   * Verificar si un pedido ya tiene factura generada
   */
  async existeFacturaPorPedido(idPedido: number): Promise<boolean> {
    const count = await this.facturaRepository.count({
      where: { idPedido },
    });
    return count > 0;
  }

  /**
   * RF-XX: Subir evidencia fotográfica y GPS desde la app móvil
   * Guarda el Base64 directamente en la BD
   */
  async subirEvidencia(
    idFactura: number,
    dto: UploadEvidenciaDto,
  ): Promise<FacturaResponseDto> {
    const factura = await this.facturaRepository.findOne({
      where: { idFactura },
      relations: ['detalles'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID ${idFactura} no encontrada`);
    }

    if (factura.estado === EstadoFactura.ANULADA) {
      throw new BadRequestException(
        'No se puede agregar evidencia a una factura anulada',
      );
    }

    // 📷 Guardar base64 directo en BD
    factura.fotoBase64 = dto.fotoBase64;

    // 📍 Guardar coordenadas GPS si se proporcionan
    if (dto.latitud !== undefined) factura.latitud = dto.latitud;
    if (dto.longitud !== undefined) factura.longitud = dto.longitud;

    const facturaActualizada = await this.facturaRepository.save(factura);
    return this.mapToResponseDto(facturaActualizada);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  private mapToResponseDto(factura: Factura): FacturaResponseDto {
    return plainToClass(FacturaResponseDto, factura, {
      excludeExtraneousValues: true,
    });
  }
}