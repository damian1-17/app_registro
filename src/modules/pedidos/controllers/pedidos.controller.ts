import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { PedidosService } from '../services/pedidos.service';
import { CreatePedidoDto } from '../dtos/create-pedido.dto';
import { UpdatePedidoEstadoDto } from '../dtos/update-pedido-estado.dto';
import { FilterPedidoDto } from '../dtos/filter-pedido.dto';
import { PedidoResponseDto, PaginatedPedidosResponseDto } from '../dtos/response/pedido-response.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { AuthUser } from '../../auth/interfaces';
import { UpdatePedidoDto } from '../dtos/update-pedido.dto';

@ApiTags('Pedidos')
@Controller('pedidos')
@ApiCookieAuth('accessToken')
@UseGuards(RolesGuard, PermissionsGuard)
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) { }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido creado exitosamente', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Productos no disponibles' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createPedidoDto: CreatePedidoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.create(user.idUsuario, createPedidoDto);
  }


  //FACTURACION

  /**
     * NUEVO ENDPOINT: Aprobar pedido (solo supervisores)
     */
  @Patch(':id/aprobar')
  @Roles('SUPERVISOR','admin') // ← SOLO SUPERVISORES 
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'Aprobar un pedido (genera factura automáticamente)',
    description: 'Al aprobar el pedido, el sistema genera automáticamente una factura asociada',
  })
  @ApiResponse({ status: 200, description: 'Pedido aprobado exitosamente' })
  @ApiResponse({ status: 400, description: 'Pedido no puede ser aprobado' })
  @ApiResponse({ status: 403, description: 'Sin permisos de supervisor' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async aprobarPedido(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pedidosService.aprobarPedido(id, user.idUsuario);
  }






  @Get()
  @ApiOperation({ summary: 'Obtener todos los pedidos (usuario: solo propios, admin: todos)' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos', type: PaginatedPedidosResponseDto })
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() filters: FilterPedidoDto,
  ): Promise<PaginatedPedidosResponseDto> {
    // Normalizar roles a mayúsculas para comparación
    const rolesNormalizados = user.roles.map(rol => rol.toUpperCase());

    // Determinar si el usuario es CLIENTE (rol más restrictivo)
    // ADMIN, SUPERVISOR y VENDEDOR tienen acceso total
    const esCliente = rolesNormalizados.includes('CLIENTE') &&
      !rolesNormalizados.includes('admin') &&
      !rolesNormalizados.includes('SUPERVISOR') &&
      !rolesNormalizados.includes('VENDEDOR');

    // isAdmin es true si NO es cliente (tiene roles privilegiados)
    const isAdmin = !esCliente;

    return this.pedidosService.findAll(user.idUsuario, filters, isAdmin);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de pedidos' })
  @ApiResponse({ status: 200, description: 'Estadísticas de pedidos' })
  async getEstadisticas(@CurrentUser() user: AuthUser) {
    const isAdmin = user.roles.includes('admin');
    return this.pedidosService.getEstadisticas(isAdmin ? undefined : user.idUsuario);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado', type: PedidoResponseDto })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para ver este pedido' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<PedidoResponseDto> {
    const isAdmin = user.roles.includes('admin');
    return this.pedidosService.findOne(id, user.idUsuario, isAdmin);
  }

  @Patch(':id/estado')
  @Roles('admin', 'SUPERVISOR') // ← SOLO ADMIN Y SUPERVISOR PUEDEN ACTUALIZAR ESTADO
  @Permissions('orders:update')
  @ApiOperation({ summary: 'Actualizar estado del pedido (solo admin)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Transición de estado no permitida' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdatePedidoEstadoDto,
  ): Promise<PedidoResponseDto> {
    return this.pedidosService.updateEstado(id, updateEstadoDto);
  }

  @Patch(':id/cancelar')
  @Roles('admin', 'SUPERVISOR') // ← ADMIN Y SUPERVISOR PUEDEN CANCELAR
  @ApiOperation({ summary: 'Cancelar un pedido' })
  @ApiResponse({ status: 200, description: 'Pedido cancelado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'No se puede cancelar el pedido' })
  @ApiResponse({ status: 403, description: 'Sin permisos para cancelar este pedido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<PedidoResponseDto> {
    // Normalizar roles a mayúsculas para comparación
    const rolesNormalizados = user.roles.map(rol => rol.toUpperCase());

    // ADMIN y SUPERVISOR tienen permisos para cancelar cualquier pedido
    const tienePermisosAdmin = rolesNormalizados.includes('admin') ||
      rolesNormalizados.includes('SUPERVISOR');

    return this.pedidosService.cancelar(id, user.idUsuario, tienePermisosAdmin);
  }

  @Delete(':id')
  @Roles('admin')
  @Permissions('orders:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un pedido cancelado (solo admin)' })
  @ApiResponse({ status: 204, description: 'Pedido eliminado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden eliminar pedidos cancelados' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.pedidosService.remove(id);
  }



  // Agregar este método en el controller
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos del pedido (solo pendientes)' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado', type: PedidoResponseDto })
  @ApiResponse({ status: 400, description: 'Solo se pueden actualizar pedidos pendientes' })
  @ApiResponse({ status: 403, description: 'Sin permisos para actualizar este pedido' })
  @ApiResponse({ status: 404, description: 'Pedido no encontrado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePedidoDto: UpdatePedidoDto,
    @CurrentUser() user: AuthUser,
  ): Promise<PedidoResponseDto> {
    const isAdmin = user.roles.includes('admin');
    return this.pedidosService.update(id, updatePedidoDto, user.idUsuario, isAdmin);
  }
}