import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FacturacionService } from '../services/facturacion.service';
import { CreateFacturaDto } from '../dtos/request/create-factura.dto';
import { UpdateFacturaDto } from '../dtos/request/update-factura.dto';
import { UploadEvidenciaDto } from '../dtos/upload-evidencia.dto';
import {
  FacturaResponseDto,
  PaginatedFacturasResponseDto,
} from '../dtos/response/factura-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { EstadoFactura } from '../constants/facturacion.constants';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Facturación')
@ApiBearerAuth()
@Controller('facturacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacturacionController {
  constructor(private readonly facturacionService: FacturacionService) {}

  // =========================================================================
  // RF-02: CREAR FACTURA DIRECTA
  // =========================================================================

  @Post('directa')
  @Roles('VENDEDOR', 'SUPERVISOR', 'admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear factura directa (sin pedido)',
    description:
      'Permite crear una factura directamente sin pedido asociado. ' +
      'El idCliente es opcional: si se proporciona debe existir y estar activo; ' +
      'si no se proporciona se genera una factura para cliente no registrado.',
  })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente', type: FacturaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos, cliente inactivo o productos no disponibles' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Prohibido - Rol insuficiente' })
  @ApiResponse({ status: 404, description: 'Cliente o productos no encontrados' })
  async createFacturaDirecta(
    @Body() createFacturaDto: CreateFacturaDto,
    @CurrentUser('idUsuario') vendedorId: number,
  ): Promise<FacturaResponseDto> {
    return this.facturacionService.createFacturaDirecta(createFacturaDto, vendedorId);
  }

  // =========================================================================
  // RF-04: LISTAR FACTURAS
  // =========================================================================

  @Get()
  @ApiOperation({
    summary: 'Listar facturas',
    description:
      'Obtiene lista paginada de facturas. ADMIN/SUPERVISOR/VENDEDOR ven todas; CLIENTE solo las suyas.',
  })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoFactura })
  @ApiQuery({ name: 'fechaDesde', required: false, type: String, example: '2024-01-01' })
  @ApiQuery({ name: 'fechaHasta', required: false, type: String, example: '2027-01-31' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedFacturasResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @CurrentUser('idUsuario') userId: number,
    @CurrentUser('roles') roles: string[],
    @Query('estado') estado?: EstadoFactura,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedFacturasResponseDto> {
    const rolesNormalizados = roles.map((rol) => rol.toUpperCase());

    const esCliente =
      rolesNormalizados.includes('CLIENTE') &&
      !rolesNormalizados.includes('ADMIN') &&
      !rolesNormalizados.includes('SUPERVISOR') &&
      !rolesNormalizados.includes('VENDEDOR');

    const idCliente = esCliente ? userId : undefined;

    const filters: {
      estado?: EstadoFactura;
      fechaDesde?: string;
      fechaHasta?: string;
      page: number;
      limit: number;
    } = { page, limit };

    if (estado !== undefined) filters.estado = estado;
    if (fechaDesde !== undefined) filters.fechaDesde = fechaDesde;
    if (fechaHasta !== undefined) filters.fechaHasta = fechaHasta;

    return this.facturacionService.findAll(idCliente, filters);
  }

  // =========================================================================
  // BUSCAR POR NÚMERO DE FACTURA
  // ⚠️ Debe ir ANTES de :id para evitar colisión de rutas
  // =========================================================================

  @Get('numero/:numeroFactura')
  @ApiOperation({
    summary: 'Buscar factura por número',
    description: 'Busca una factura por su número único (FAC-DIR-XXXXXXXX o FAC-PED-XXXXXXXX)',
  })
  @ApiParam({ name: 'numeroFactura', type: String, example: 'FAC-DIR-00000001' })
  @ApiResponse({ status: 200, type: FacturaResponseDto })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findByNumero(
    @Param('numeroFactura') numeroFactura: string,
  ): Promise<FacturaResponseDto> {
    return this.facturacionService.findByNumero(numeroFactura);
  }

  // =========================================================================
  // FACTURAS POR CLIENTE
  // ⚠️ Debe ir ANTES de :id para evitar colisión de rutas
  // =========================================================================

  @Get('cliente/:idCliente')
  @Roles('VENDEDOR', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Obtener facturas por cliente',
    description: 'Lista todas las facturas de un cliente específico. Solo para vendedores y supervisores.',
  })
  @ApiParam({ name: 'idCliente', type: Number, description: 'ID del cliente' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, type: PaginatedFacturasResponseDto })
  @ApiResponse({ status: 403, description: 'Rol insuficiente' })
  async findByCliente(
    @Param('idCliente', ParseIntPipe) idCliente: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedFacturasResponseDto> {
    return this.facturacionService.findAll(idCliente, { page, limit });
  }

  // =========================================================================
  // RF-04 / RF-07: OBTENER FACTURA POR ID
  // =========================================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener factura por ID',
    description: 'Los clientes solo pueden ver sus propias facturas.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FacturaResponseDto })
  @ApiResponse({ status: 403, description: 'No tienes permiso para ver esta factura' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('idUsuario') userId: number,
    @CurrentUser('roles') roles: string[],
  ): Promise<FacturaResponseDto> {
    const isCliente = roles.map((r) => r.toUpperCase()).includes('CLIENTE');
    const idCliente = isCliente ? userId : undefined;

    return this.facturacionService.findOne(id, idCliente);
  }

  // =========================================================================
  // ACTUALIZAR ESTADO
  // =========================================================================

  @Patch(':id/estado')
  @Roles('VENDEDOR', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Actualizar estado de factura',
    description: 'Actualiza el estado de una factura. Solo para vendedores y supervisores.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FacturaResponseDto })
  @ApiResponse({ status: 400, description: 'No se puede modificar una factura anulada' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacturaDto: UpdateFacturaDto,
  ): Promise<FacturaResponseDto> {
    return this.facturacionService.updateEstado(id, updateFacturaDto);
  }

  // =========================================================================
  // SUBIR EVIDENCIA (FOTO + GPS) DESDE APP MÓVIL
  // =========================================================================

  @Patch(':id/evidencia')
  @ApiOperation({
    summary: 'Subir evidencia de factura',
    description: 'Guarda fotografía en Base64 y coordenadas GPS desde la app móvil.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: FacturaResponseDto })
  @ApiResponse({ status: 400, description: 'Factura anulada o datos inválidos' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  async subirEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadEvidenciaDto,
  ): Promise<FacturaResponseDto> {
    return this.facturacionService.subirEvidencia(id, dto);
  }
}