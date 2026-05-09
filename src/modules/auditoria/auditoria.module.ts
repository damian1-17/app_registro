import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaService } from './services/auditoria.service';
import { AuditoriaController } from './controllers/auditoria.controller';
import { Auditoria } from './entities/auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auditoria], 'PEDIDOS_DB')],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService], // ✅ Exportar para usar en otros módulos
})
export class AuditoriaModule {}