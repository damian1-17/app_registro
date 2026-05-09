import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFieldsToPedidos1733370000000 implements MigrationInterface {
  name = 'AddFieldsToPedidos1733370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columnas a la tabla pedidos
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      ADD COLUMN "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'efectivo'
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      ADD COLUMN "direccion" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      ADD COLUMN "observaciones" TEXT
    `);

    console.log('✅ Campos agregados a tabla pedidos exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP COLUMN IF EXISTS "observaciones"
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP COLUMN IF EXISTS "direccion"
    `);

    await queryRunner.query(`
      ALTER TABLE "pedidos" 
      DROP COLUMN IF EXISTS "metodo_pago"
    `);

    console.log('✅ Campos removidos de tabla pedidos exitosamente');
  }
}