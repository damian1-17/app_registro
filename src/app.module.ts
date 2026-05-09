import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from "./modules/auth/auth.module";
import { ProductosModule } from './modules/productos/productos.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { PermissionsGuard } from "./modules/auth/guards/permissions.guard";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
 import { FacturacionModule } from './modules/facturacion/facturacion.module'; // ← NUEVO


//facturación
import { EventEmitterModule } from "@nestjs/event-emitter";

import { DataSources } from "./database/data-sources.module";


//Usuarios
import { UsuariosModule } from './modules/usuarios/usuarios.module';


//ROLES
import { RolesModule } from './modules/roles/roles.module';

@Module({
  imports: [
    // Variables de entorno globales
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    //FACTURACIÓN
    EventEmitterModule.forRoot(),
    DataSources,       //  Módulo de conexión a múltiples bases de datos
    AuditoriaModule,  //  Módulo de auditoría
    //  Módulos reales del sistema
    AuthModule,
    ProductosModule,
    PedidosModule,
    FacturacionModule, // ← NUEVO
    UsuariosModule,   //  Módulo de gestión de usuarios
    RolesModule,      //  Módulo de gestión de roles
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,          // 1. Primero autentica el token
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,            // 2. Luego valida roles
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,      // 3. Luego valida permisos
    },
  ],
})
export class AppModule { }
