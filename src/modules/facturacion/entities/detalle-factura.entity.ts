import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Factura } from './factura.entity';


@Entity('detalle_facturas')
export class DetalleFactura {
    @PrimaryGeneratedColumn({ name: 'id_detalle' })
    idDetalle: number;

    @Column({ name: 'id_factura' })
    idFactura: number;

    @Column({ name: 'id_producto' })
    idProducto: number;

    @Column({ length: 200 })
    nombreProducto: string;

    @Column({ type: 'int' })
    cantidad: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    precioUnitario: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    descuento: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    subtotal: number;



    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;




    // ✅ AGREGAR ESTA RELACIÓN
    @ManyToOne(() => Factura, (factura) => factura.detalles, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'id_factura' })
    factura: Factura;
}