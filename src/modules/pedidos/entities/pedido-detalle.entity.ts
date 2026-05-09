import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Pedido } from './pedido.entity';
import { Producto } from '../../productos/entities/producto.entity';

@Entity('pedidos_detalle')
export class PedidoDetalle {
  @PrimaryGeneratedColumn({ name: 'id_detalle' })
  idDetalle: number;

  @Column({ name: 'id_pedido', type: 'int', nullable: false })
  idPedido: number;

  @Column({ name: 'id_producto', type: 'int', nullable: false })
  idProducto: number;

  @Column({ type: 'int', nullable: false })
  cantidad: number;

  @Column({ 
    name: 'precio_unitario', 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: false 
  })
  precioUnitario: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2, 
    nullable: false 
  })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Pedido, (pedido) => pedido.detalles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_pedido' })
  pedido: Pedido;

  @ManyToOne(() => Producto, (producto) => producto.detalles, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'id_producto' })
  producto: Producto;
}