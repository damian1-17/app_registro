import AppDataSource from '@/config/typeorm.config';

async function showMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('📊 Estado de las migraciones:');
    const migrations = await AppDataSource.showMigrations();
    if (migrations) {
      console.log('⚠️ Hay migraciones pendientes.');
    } else {
      console.log('✅ Todas las migraciones están aplicadas.');
    }
  } catch (error) {
    console.error('❌ Error al mostrar migraciones:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

showMigrations();
