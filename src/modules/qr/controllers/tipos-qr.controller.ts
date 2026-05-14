// src/modules/qr/controllers/tipos-qr.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { TiposQrService } from '../services/tipos-qr.service';
import {
  CreateTipoQrDto,
  UpdateTipoQrDto,
  TipoQrResponseDto,
  QueryTiposQrDto,
} from '../dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';     // descomenta cuando tengas el guard
// import { RolesGuard }   from '../../auth/guards/roles.guard';
// import { Roles }        from '../../auth/decorators/roles.decorator';

@ApiTags('QR - Tipos')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr/tipos')
export class TiposQrController {
  constructor(private readonly tiposQrService: TiposQrService) {}

  @Post()
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo tipo de QR' })
  @ApiResponse({ status: 201, type: TipoQrResponseDto })
  create(@Body() dto: CreateTipoQrDto) {
    return this.tiposQrService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los tipos de QR' })
  @ApiResponse({ status: 200, type: [TipoQrResponseDto] })
  findAll(@Query() query: QueryTiposQrDto) {
    return this.tiposQrService.findAll(query);
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar tipos de QR activos (para selects)' })
  @ApiResponse({ status: 200, type: [TipoQrResponseDto] })
  findActivos() {
    return this.tiposQrService.findActivos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un tipo de QR por ID' })
  @ApiResponse({ status: 200, type: TipoQrResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tiposQrService.findOne(id);
  }

  @Patch(':id')
  // @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un tipo de QR' })
  @ApiResponse({ status: 200, type: TipoQrResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoQrDto,
  ) {
    return this.tiposQrService.update(id, dto);
  }
}