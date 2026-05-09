import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { DataSource } from 'typeorm';
import AppDataSource from '@/typeorm.config';

import { seedInitialData } from './initial-seed';
import { CreateUsersSeeder } from './user.seeder';
import { seedCommerceData } from './commerce-seed';
import { SeedAuditReadPermission1734567890000 } from './AuditReadPermission';

async function bootstrap() {
  await AppDataSource.initialize();
  console.log('🌱 Iniciando seeders...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    console.log('----------------------------------------');
    console.log('    EJECUTANDO SEED INITIAL (ROLES + PERMISOS)');
    console.log('----------------------------------------');

    await seedInitialData(dataSource);

    console.log('----------------------------------------');
    console.log('    EJECUTANDO SEED USERS');
    console.log('----------------------------------------');

    const userSeeder = new CreateUsersSeeder();
    await userSeeder.run(dataSource);

    console.log('🎉 Usuarios creados correctamente');

        console.log('----------------------------------------');
    console.log('    EJECUTANDO SEED PERMISO AUDIT READ');
    console.log('----------------------------------------');

    const auditSeeder = new SeedAuditReadPermission1734567890000();
    await auditSeeder.up(dataSource.createQueryRunner());
    console.log('🎉 Permiso de auditoría creado correctamente');

    console.log('----------------------------------------');
    console.log('    EJECUTANDO SEED COMMERCE');
    console.log('----------------------------------------');

    await seedCommerceData(dataSource);

    console.log('🎉 Seeders de comercio completados');

  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
  } finally {
    await app.close();
    await AppDataSource.destroy();
  }
}

bootstrap();
