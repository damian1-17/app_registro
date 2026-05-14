// src/modules/qr/entities/usuario-qr.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TipoQr } from './tipo-qr.entity';

export enum EstadoQr {
  ACTIVO = 'activo',
  USADO = 'usado',
  EXPIRADO = 'expirado',
  CANCELADO = 'cancelado',
}

@Entity('usuarios_qr')
@Index('idx_usuario_tipo_qr', ['idUsuario', 'idTipoQr'])
export class UsuarioQr {
  @PrimaryGeneratedColumn('uuid', { name: 'id_usuario_qr' })
  idUsuarioQr!: string;

  @Column({ name: 'id_usuario', type: 'int' })
  @Index('idx_qr_usuario')
  idUsuario!: number;

  /**
   * idTipoQr es legible pero TypeORM NO lo usa al escribir:
   * la FK la gestiona @JoinColumn en la relación tipoQr.
   * Al hacer create({ tipoQr: { idTipoQr: X } }) o
   * create({ tipoQrId: X }) usamos el nombre de la FK expuesto
   * por la relación. Ver nota en el servicio.
   */
  @Column({ name: 'id_tipo_qr', type: 'int', insert: false, update: false })
  @Index('idx_qr_tipo')
  idTipoQr!: number;

  @Column({ type: 'uuid', unique: true })
  @Index('idx_qr_token')
  token!: string;

  @Column({ type: 'varchar', length: 20, default: EstadoQr.ACTIVO })
  estado!: EstadoQr;

  @Column({ type: 'boolean', default: false })
  usado!: boolean;

  @Column({ name: 'fecha_uso', type: 'timestamp', nullable: true })
  fechaUso!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiracion!: Date | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * La relación es dueña de la columna id_tipo_qr.
   * Para asignar al crear, pasar el objeto TipoQr completo
   * o usar la propiedad "tipoQrIdTipoQr" que TypeORM expone
   * automáticamente como alias de la FK.
   */
  @ManyToOne(() => TipoQr, (tipo) => tipo.usuariosQr, { eager: true })
  @JoinColumn({ name: 'id_tipo_qr' })
  tipoQr!: TipoQr;
}