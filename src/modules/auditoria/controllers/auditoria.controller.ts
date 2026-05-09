import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { AuditoriaService } from '../services/auditoria.service';
import { FilterAuditoriaDto } from '../dtos/filter-auditoria.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Auditoría')
@Controller('auditoria')
@ApiCookieAuth('accessToken')
@Roles('admin') // Solo admin puede ver auditoría
@Permissions('audit:read')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener registros de auditoría con filtros' })
  @ApiResponse({ status: 200, description: 'Registros de auditoría' })
  async findAll(@Query() filters: FilterAuditoriaDto) {
    return this.auditoriaService.findAll(filters);
  }

  @Get('historial/:entidad/:id')
  @ApiOperation({ summary: 'Obtener historial de una entidad específica' })
  @ApiResponse({ status: 200, description: 'Historial de la entidad' })
  async getHistorial(
    @Param('entidad') entidad: string,
    @Param('id') id: string,
  ) {
    return this.auditoriaService.getHistorial(entidad, id);
  }

  @Get('estadisticas')
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría' })
  @ApiResponse({ status: 200, description: 'Estadísticas de auditoría' })
  async getEstadisticas(
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
  ) {
    return this.auditoriaService.getEstadisticas(fechaDesde, fechaHasta);
  }
}