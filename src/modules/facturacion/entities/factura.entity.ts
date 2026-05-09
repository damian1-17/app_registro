import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DetalleFactura } from './detalle-factura.entity';

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn({ name: 'id_factura' })
  idFactura: number;

  @Column({ name: 'id_pedido', nullable: true, type: 'int' })
  idPedido: number | null;

  @Column({ name: 'numero_factura', unique: true, length: 50 })
  numeroFactura: string;

  @Column({ name: 'id_cliente', nullable: true, type: 'int' })
  idCliente: number | null;

  @Column({ length: 100 })
  nombreCliente: string;

  @Column({ length: 10 })
  cedula: string;

  @Column({ nullable: true, length: 200 })
  direccion: string;

  @Column({ nullable: true, length: 100 })
  telefono: string;

  @Column({ nullable: true, length: 100 })
  email: string;

  @Column({ type: 'date' })
  fechaEmision: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 15 })
  porcentajeIva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  iva: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: ['efectivo', 'tarjeta', 'transferencia', 'credito'],
    default: 'efectivo',
  })
  formaPago: string;

  @Column({
    type: 'enum',
    enum: ['emitida', 'pagada', 'anulada'],
    default: 'emitida',
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'date', nullable: true })
  fechaAutorizacion: Date;

  // 📍 Coordenadas GPS (capturadas desde app móvil)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitud: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitud: number | null;

  // ✅ Reemplaza por esto:
  @Column({ name: 'foto_base64', type: 'text', nullable: true })
  fotoBase64: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DetalleFactura, (detalle) => detalle.factura, {
    cascade: true,
  })
  detalles: DetalleFactura[];
}