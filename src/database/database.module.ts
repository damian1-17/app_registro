// src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { pedidosDS } from '@/config/pedidosDS.config';
import { facturacionDS } from '@/config/facturacionDS.config';
import { seguridadDS } from '@/config/seguridadDS.config';
import { DatabaseService } from './services/database.service';


// Entidades de seguridad
import { Usuario } from '@/modules/auth/entities/usuario.entity';
import { Rol } from '@/modules/auth/entities/rol.entity';
import { Permiso } from '@/modules/auth/entities/permiso.entity';
import { Token } from '@/modules/auth/entities/token.entity';
import { Sesion } from '@/modules/auth/entities/sesion.entity';
import { PasswordRecoveryCode } from '@/modules/auth/entities/password-recovery-code.entity';

@Module({
  imports: [
    // TypeOrmModule.forRoot({ ...pedidosDS, name: 'PEDIDOS_DB' }),
    // TypeOrmModule.forRoot({ ...facturacionDS, name: 'FACTURACION_DB' }),
    TypeOrmModule.forRoot({
      ...seguridadDS, name: 'SEGURIDAD_DB',
      entities: [Usuario, Rol, Permiso, Token, Sesion, PasswordRecoveryCode]
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule { }