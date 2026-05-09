import { AccionAuditoria } from '../entities/auditoria.entity';

export class CreateAuditoriaDto {
  entidad: string;
  idEntidad: string | number;
  accion: AccionAuditoria;
  usuarioId?: number;
  usuarioEmail?: string;
  datosAnteriores?: Record<string, any>;
  datosNuevos?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  detalles?: string;
}