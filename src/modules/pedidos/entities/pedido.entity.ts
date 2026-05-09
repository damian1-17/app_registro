import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';
import { PedidoDetalle } from './pedido-detalle.entity';

export enum EstadoPedido {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  EN_PROCESO = 'en_proceso',
  ENVIADO = 'enviado',
  ENTREGADO = 'entregado',
  CANCELADO = 'cancelado',
}

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  PAYPAL = 'paypal',
  MERCADO_PAGO = 'mercado_pago',
}

@Entity('pedidos')
export class Pedido {
  @PrimaryGeneratedColumn({ name: 'id_pedido' })
  idPedido: number;

  @Column({ name: 'id_cliente', type: 'int', nullable: false })
  idCliente: number;

  @Column({ name: 'cedula', type: 'varchar', length: 10, nullable: false })
  cedula: string;
  @Column({ type: 'varchar', length: 100, nullable: true }) // ← AGREGAR
  telefono?: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({
    type: 'varchar',
    length: 20,
    default: EstadoPedido.PENDIENTE
  })
  estado: EstadoPedido;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  // ✅ NUEVOS CAMPOS
  @Column({
    name: 'metodo_pago',
    type: 'varchar',
    length: 50,
    default: MetodoPago.EFECTIVO
  })
  metodoPago: MetodoPago;

  @Column({ type: 'text', nullable: true })
  direccion?: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Usuario;

  @OneToMany(() => PedidoDetalle, (detalle) => detalle.pedido, {
    cascade: true,
  })
  detalles: PedidoDetalle[];
}