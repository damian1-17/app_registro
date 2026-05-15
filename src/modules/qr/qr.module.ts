// src/modules/qr/qr.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TipoQr } from './entities/tipo-qr.entity';
import { UsuarioQr } from './entities/usuario-qr.entity';

import { TiposQrService } from './services/tipos-qr.service';
import { UsuariosQrService } from './services/usuarios-qr.service';

import { TiposQrController } from './controllers/tipos-qr.controller';
import { UsuariosQrController } from './controllers/usuarios-qr.controller';
import { Usuario } from '../auth/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TipoQr, UsuarioQr, Usuario], 'SEGURIDAD_DB'),

  ],
  controllers: [TiposQrController, UsuariosQrController],
  providers: [TiposQrService, UsuariosQrService],
  exports: [TiposQrService, UsuariosQrService],
})
export class QrModule {}