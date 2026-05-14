import AppDataSource from '@/config/typeorm.config';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('📦 Ejecutando migraciones...');
    await AppDataSource.runMigrations();
    console.log('✅ Migraciones ejecutadas correctamente.');
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

runMigrations();
