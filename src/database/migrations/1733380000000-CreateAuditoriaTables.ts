import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditoriaTables1733380000000 implements MigrationInterface {
  name = 'CreateAuditoriaTables1733380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tabla de auditoría
    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id_auditoria" BIGSERIAL PRIMARY KEY,
        "entidad" VARCHAR(100) NOT NULL,
        "id_entidad" VARCHAR(50) NOT NULL,
        "accion" VARCHAR(20) NOT NULL,
        "usuario_id" INT,
        "usuario_email" VARCHAR(80),
        "datos_anteriores" JSONB,
        "datos_nuevos" JSONB,
        "ip" VARCHAR(64),
        "user_agent" VARCHAR(255),
        "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "detalles" TEXT
      )
    `);

    // Índices para mejorar búsquedas
    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_entidad" ON "auditoria" ("entidad")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_id_entidad" ON "auditoria" ("id_entidad")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_accion" ON "auditoria" ("accion")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_usuario" ON "auditoria" ("usuario_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_fecha" ON "auditoria" ("fecha" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auditoria_entidad_id" ON "auditoria" ("entidad", "id_entidad")
    `);

    console.log('✅ Tabla de auditoría creada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_entidad_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_usuario"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_accion"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_id_entidad"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auditoria_entidad"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auditoria"`);

    console.log('✅ Tabla de auditoría eliminada exitosamente');
  }
}