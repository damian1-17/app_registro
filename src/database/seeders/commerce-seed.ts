import { DataSource } from 'typeorm';
import { Producto } from '@/modules/productos/entities/producto.entity';
import { Pedido, EstadoPedido } from '@/modules/pedidos/entities/pedido.entity';
import { PedidoDetalle } from '@/modules/pedidos/entities/pedido-detalle.entity';
import { Usuario } from '@/modules/auth/entities/usuario.entity';

export async function seedCommerceData(dataSource: DataSource) {
  const productoRepository = dataSource.getRepository(Producto);
  const pedidoRepository = dataSource.getRepository(Pedido);
  const detalleRepository = dataSource.getRepository(PedidoDetalle);
  const usuarioRepository = dataSource.getRepository(Usuario);

  console.log('🛍️ Iniciando seeding de comercio...');

  try {
    // Crear productos de ejemplo
    const productos = [
      {
        nombre: 'Laptop HP 15"',
        descripcion: 'Laptop HP con procesador Intel i5, 8GB RAM, 256GB SSD',
        precio: 599.99,
        activo: true,
      },
      {
        nombre: 'Mouse Logitech MX Master',
        descripcion: 'Mouse ergonómico inalámbrico de alta precisión',
        precio: 89.99,
        activo: true,
      },
      {
        nombre: 'Teclado Mecánico RGB',
        descripcion: 'Teclado mecánico con switches Cherry MX Blue',
        precio: 129.99,
        activo: true,
      },
      {
        nombre: 'Monitor 27" 4K',
        descripcion: 'Monitor IPS 4K UHD con HDR',
        precio: 449.99,
        activo: true,
      },
      {
        nombre: 'Webcam HD 1080p',
        descripcion: 'Cámara web Full HD con micrófono integrado',
        precio: 79.99,
        activo: true,
      },
    ];

    const productosCreados = [];
    for (const productoData of productos) {
      const exists = await productoRepository.findOne({ 
        where: { nombre: productoData.nombre } 
      });
      
      if (!exists) {
        const producto = productoRepository.create(productoData);
        const saved = await productoRepository.save(producto);
        productosCreados.push(saved);
        console.log(`✅ Producto creado: ${productoData.nombre}`);
      } else {
        productosCreados.push(exists);
        console.log(`⏭️  Producto ya existe: ${productoData.nombre}`);
      }
    }

    // Obtener un usuario para crear pedidos de ejemplo
    const usuario = await usuarioRepository.findOne({ where: { idUsuario: 1 } });
    
    if (usuario && productosCreados.length > 0) {
      // Crear pedido de ejemplo
      const pedidoExists = await pedidoRepository.findOne({ 
        where: { idCliente: usuario.idUsuario } 
      });

      if (!pedidoExists) {
        // Crear pedido
        const pedido = pedidoRepository.create({
          idCliente: usuario.idUsuario,
          estado: EstadoPedido.CONFIRMADO,
          total: 0, // Se calculará después
        });
        const pedidoGuardado = await pedidoRepository.save(pedido);

        // Crear detalles del pedido
        let totalPedido = 0;
        if (productosCreados.length < 2) {
          throw new Error('No hay suficientes productos para crear detalles de pedido.');
        }
        const detalles = [
          {
            idPedido: pedidoGuardado.idPedido,
            idProducto: productosCreados[0]!.idProducto, // Laptop
            cantidad: 1,
            precioUnitario: productosCreados[0]!.precio,
            subtotal: productosCreados[0]!.precio * 1,
          },
          {
            idPedido: pedidoGuardado.idPedido,
            idProducto: productosCreados[1]!.idProducto, // Mouse
            cantidad: 2,
            precioUnitario: productosCreados[1]!.precio,
            subtotal: productosCreados[1]!.precio * 2,
          },
        ];

        for (const detalleData of detalles) {
          const detalle = detalleRepository.create(detalleData);
          await detalleRepository.save(detalle);
          totalPedido += detalleData.subtotal;
        }

        // Actualizar total del pedido
        pedidoGuardado.total = totalPedido;
        await pedidoRepository.save(pedidoGuardado);

        console.log(`✅ Pedido creado con ID: ${pedidoGuardado.idPedido}, Total: $${totalPedido}`);
      } else {
        console.log('⏭️  Ya existe un pedido para este usuario');
      }
    }

    console.log('\n🎉 Seeding de comercio completado!');
    console.log(`📦 Total productos: ${productosCreados.length}`);
    
  } catch (error) {
    console.error('❌ Error ejecutando seeding de comercio:', error);
    throw error;
  }
}