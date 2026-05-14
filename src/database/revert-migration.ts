import AppDataSource from '@/config/typeorm.config';

async function revertMigration() {
  try {
    await AppDataSource.initialize();
    console.log('⏪ Revirtiendo última migración...');
    await AppDataSource.undoLastMigration();
    console.log('✅ Migración revertida correctamente.');
  } catch (error) {
    console.error('❌ Error al revertir migración:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

revertMigration();
