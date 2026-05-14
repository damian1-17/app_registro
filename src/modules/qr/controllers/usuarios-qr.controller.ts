// src/modules/qr/controllers/usuarios-qr.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  // UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

import { UsuariosQrService } from '../services/usuarios-qr.service';
import {
  AsignarQrDto,
  AsignarTodosQrDto,
  AsignarQrLoteDto,
  CancelarQrDto,
  EscanearQrDto,
  UsuarioQrResponseDto,
  ResultadoEscaneoDto,
  QueryUsuarioQrDto,
} from '../dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard }   from '../../auth/guards/roles.guard';
// import { Roles }        from '../../auth/decorators/roles.decorator';


// En tu usuarios-qr.controller.ts
import { AsignarQrARolDto } from '../dto/asignar-qr-a-rol.dto';



@ApiTags('QR - Usuarios')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr')
export class UsuariosQrController {
  constructor(private readonly usuariosQrService: UsuariosQrService) { }


  @Post('asignar-rol-user')
  @ApiOperation({ summary: 'Asigna un QR a todos los usuarios con rol user' })
  @ApiResponse({ status: 201, description: 'Resultado del proceso de asignación masiva' })
  async asignarQrARolUser(@Body() dto: AsignarQrARolDto) {
    return this.usuariosQrService.asignarQrARolUser(dto);
  }
  // ─── Asignación ─────────────────────────────────────────────────────────────

  @Post('asignar')
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Asignar un tipo de QR a un usuario' })
  @ApiResponse({ status: 201, type: UsuarioQrResponseDto })
  asignarQr(@Body() dto: AsignarQrDto) {
    return this.usuariosQrService.asignarQr(dto);
  }

  @Post('asignar/todos')
  // @Roles('ADMIN')
  @ApiOperation({
    summary: 'Asignar TODOS los tipos de QR activos a un usuario',
  })
  @ApiResponse({ status: 201, type: [UsuarioQrResponseDto] })
  asignarTodos(@Body() dto: AsignarTodosQrDto) {
    return this.usuariosQrService.asignarTodosQr(dto);
  }

  @Post('asignar/lote')
  // @Roles('ADMIN')
  @ApiOperation({
    summary: 'Asignación en lote: varios usuarios × varios tipos',
  })
  asignarLote(@Body() dto: AsignarQrLoteDto) {
    return this.usuariosQrService.asignarQrLote(dto);
  }

  // ─── Escaneo (staff) ─────────────────────────────────────────────────────────

  @Post('escanear')
  // @Roles('STAFF', 'ADMIN')
  @ApiOperation({
    summary: 'Escanear / validar un QR (usado por el staff del evento)',
  })
  @ApiResponse({ status: 200, type: ResultadoEscaneoDto })
  escanearQr(@Body() dto: EscanearQrDto) {
    return this.usuariosQrService.escanearQr(dto);
  }

  // ─── Cancelar ────────────────────────────────────────────────────────────────

  @Patch('cancelar')
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Cancelar / revocar un QR asignado' })
  @ApiResponse({ status: 200, type: UsuarioQrResponseDto })
  cancelarQr(@Body() dto: CancelarQrDto) {
    return this.usuariosQrService.cancelarQr(dto);
  }

  // ─── Consultas ───────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar QRs con filtros opcionales' })
  @ApiResponse({ status: 200, type: [UsuarioQrResponseDto] })
  findAll(@Query() query: QueryUsuarioQrDto) {
    return this.usuariosQrService.findAll(query);
  }

  @Get('usuario/:idUsuario')
  @ApiOperation({ summary: 'Obtener todos los QRs de un usuario' })
  @ApiParam({ name: 'idUsuario', type: Number })
  @ApiResponse({ status: 200, type: [UsuarioQrResponseDto] })
  findByUsuario(@Param('idUsuario') idUsuario: string) {
    return this.usuariosQrService.findByUsuario(+idUsuario);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Obtener datos de un QR por token' })
  @ApiParam({ name: 'token', description: 'UUID del token del QR' })
  @ApiResponse({ status: 200, type: UsuarioQrResponseDto })
  findByToken(@Param('token') token: string) {
    return this.usuariosQrService.findByToken(token);
  }
}