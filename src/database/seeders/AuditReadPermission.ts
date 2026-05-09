import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAuditReadPermission1734567890000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear permiso si no existe
    await queryRunner.query(`
      INSERT INTO permisos (clave, descripcion)
      VALUES ('audit:read', 'Leer registros de auditoría')
      ON CONFLICT (clave) DO NOTHING;
    `);

    // Asignar al rol admin
    await queryRunner.query(`
      INSERT INTO roles_permisos (id_rol, id_permiso)
      SELECT r.id_rol, p.id_permiso
      FROM roles r
      CROSS JOIN permisos p
      WHERE r.nombre = 'admin'
        AND p.clave = 'audit:read'
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover relación
    await queryRunner.query(`
      DELETE FROM roles_permisos
      WHERE id_permiso = (
        SELECT id_permiso FROM permisos WHERE clave = 'audit:read'
      );
    `);

    // Remover permiso
    await queryRunner.query(`
      DELETE FROM permisos WHERE clave = 'audit:read';
    `);
  }
}
