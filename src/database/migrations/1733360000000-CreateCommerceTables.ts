import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommerceTables1733360000000 implements MigrationInterface {
  name = 'CreateCommerceTables1733360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla: productos
    await queryRunner.query(`
      CREATE TABLE "productos" (
        "id_producto" SERIAL NOT NULL,
        "nombre" VARCHAR(150) NOT NULL,
        "descripcion" TEXT,
        "precio" DECIMAL(10,2) NOT NULL,
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_productos" PRIMARY KEY ("id_producto")
      )
    `);

    // Tabla: pedidos (relacionada con usuarios como clientes)
    await queryRunner.query(`
      CREATE TABLE "pedidos" (
        "id_pedido" SERIAL NOT NULL,
        "id_cliente" INT NOT NULL,
        "fecha" TIMESTAMP NOT NULL DEFAULT now(),
        "estado" VARCHAR(20) NOT NULL DEFAULT 'pendiente',
        "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pedidos" PRIMARY KEY ("id_pedido")
      )
    `);

    // Tabla: pedidos_detalle
    await queryRunner.query(`
      CREATE TABLE "pedidos_detalle" (
        "id_detalle" SERIAL NOT NULL,
        "id_pedido" INT NOT NULL,
        "id_producto" INT NOT NULL,
        "cantidad" INT NOT NULL,
        "precio_unitario" DECIMAL(10,2) NOT NULL,
        "subtotal" DECIMAL(10,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pedidos_detalle" PRIMARY KEY ("id_detalle")
      )
    `);

    // Foreign Keys
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      ADD CONSTRAINT "FK_pedidos_cliente" 
      FOREIGN KEY ("id_cliente") REFERENCES "usuarios"("id_usuario") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos_detalle" 
      ADD CONSTRAINT "FK_pedidos_detalle_pedido" 
      FOREIGN KEY ("id_pedido") REFERENCES "pedidos"("id_pedido") 
      ON DELETE CASCADE ON UPDATE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos_detalle" 
      ADD CONSTRAINT "FK_pedidos_detalle_producto" 
      FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") 
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);

    // Índices para mejorar rendimiento
    await queryRunner.query(`
      CREATE INDEX "idx_productos_activo" ON "productos" ("activo")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_cliente" ON "pedidos" ("id_cliente")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_estado" ON "pedidos" ("estado")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_fecha" ON "pedidos" ("fecha")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_detalle_pedido" ON "pedidos_detalle" ("id_pedido")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_pedidos_detalle_producto" ON "pedidos_detalle" ("id_producto")
    `);

    console.log('✅ Tablas de comercio creadas exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop índices
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedidos_detalle_producto"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedidos_detalle_pedido"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedidos_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedidos_estado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pedidos_cliente"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_productos_activo"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "pedidos_detalle" DROP CONSTRAINT IF EXISTS "FK_pedidos_detalle_producto"`);
    await queryRunner.query(`ALTER TABLE "pedidos_detalle" DROP CONSTRAINT IF EXISTS "FK_pedidos_detalle_pedido"`);
    await queryRunner.query(`ALTER TABLE "pedidos" DROP CONSTRAINT IF EXISTS "FK_pedidos_cliente"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "pedidos_detalle"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pedidos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "productos"`);

    console.log('✅ Tablas de comercio eliminadas exitosamente');
  }
}