import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AccionAuditoria {
  CREAR = 'crear',
  ACTUALIZAR = 'actualizar',
  ELIMINAR = 'eliminar',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CAMBIO_ESTADO = 'cambio_estado',
  ASIGNAR_ROL = 'asignar_rol',
  REMOVER_ROL = 'remover_rol',
  CAMBIO_PASSWORD = 'cambio_password',
  OTROS = 'otros',
}



export enum TablasAuditoria {
  USUARIOS = 'usuarios',
  ROLES = 'roles',
  PERMISOS = 'permisos',
  PRODUCTOS = 'productos',
  PEDIDOS = 'pedidos',

}

@Entity('auditoria')
@Index(['entidad', 'idEntidad'])
export class Auditoria {
  @PrimaryGeneratedColumn({ name: 'id_auditoria', type: 'bigint' })
  idAuditoria: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  @Index()
  entidad: string;

  @Column({ name: 'id_entidad', type: 'varchar', length: 50, nullable: false })
  @Index()
  idEntidad: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  @Index()
  accion: AccionAuditoria;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  @Index()
  usuarioId?: number;

  @Column({ name: 'usuario_email', type: 'varchar', length: 80, nullable: true })
  usuarioEmail?: string;

  @Column({ name: 'datos_anteriores', type: 'jsonb', nullable: true })
  datosAnteriores?: Record<string, any>;

  @Column({ name: 'datos_nuevos', type: 'jsonb', nullable: true })
  datosNuevos?: Record<string, any>;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip?: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  @Index()
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  detalles?: string;
}