// src/modules/qr/entities/tipo-qr.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UsuarioQr } from './usuario-qr.entity';

@Entity('tipos_qr')
export class TipoQr {
  @PrimaryGeneratedColumn({ name: 'id_tipo_qr' })
  idTipoQr: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ name: 'requiere_unico_uso', type: 'boolean', default: true })
  requiereUnicoUso: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UsuarioQr, (usuarioQr) => usuarioQr.tipoQr)
  usuariosQr: UsuarioQr[];
}