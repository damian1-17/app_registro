import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from '@/modules/pedidos/entities/pedido.entity';
import { Usuario } from '@/modules/auth/entities/usuario.entity';
import { PedidoDataParaFactura } from '../interfaces/pedido-data.interface';
/**
 * Servicio de integración entre Pedidos y Facturación
 * Permite acceder a datos de PEDIDOS_DB desde el módulo de Facturación
 */
@Injectable()
export class PedidoFacturacionIntegrationService {
  constructor(
    @InjectRepository(Pedido, 'PEDIDOS_DB')
    private readonly pedidoRepository: Repository<Pedido>,

    @InjectRepository(Usuario, 'PEDIDOS_DB')
    private readonly usuarioRepository: Repository<Usuario>,
  ) { }

  /**
   * Obtiene los datos del pedido necesarios para generar la factura
   */

  async obtenerDatosPedido(idPedido: number): Promise<PedidoDataParaFactura> {
    const pedido = await this.pedidoRepository.findOne({
      where: { idPedido },
      relations: ['detalles', 'detalles.producto'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido con ID ${idPedido} no encontrado`);
    }

    const cliente = await this.usuarioRepository.findOne({
      where: { idUsuario: pedido.idCliente },
    });

    if (!cliente) {
      throw new NotFoundException(
        `Cliente con ID ${pedido.idCliente} no encontrado`,
      );
    }

    return {
      idPedido: pedido.idPedido,
      idCliente: pedido.idCliente,
      nombreCliente: cliente.nombre,
      cedula: pedido.cedula || cliente.cedula,
      direccion: pedido.direccion,
      email: cliente.email,
      telefono: pedido.telefono || null,
      metodoPago: pedido.metodoPago,
      detalles: pedido.detalles.map((detalle) => ({
        idProducto: detalle.idProducto,
        nombreProducto: detalle.producto.nombre,
        cantidad: detalle.cantidad,
        precioUnitario: Number(detalle.precioUnitario),
      })),
    };
  }

  /**
   * Verifica que el usuario existe y está activo
   */
  async verificarUsuario(idUsuario: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { idUsuario },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${idUsuario} no encontrado`);
    }

    if (usuario.estado !== 'activo') {
      throw new NotFoundException(`Usuario ${usuario.nombre} no está activo`);
    }

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      cedula: usuario.cedula,
      email: usuario.email,
    };
  }
}