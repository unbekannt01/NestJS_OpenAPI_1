import dataSource from '../db/data-source';

async function test() {
  try {
    await dataSource.initialize();
    console.log('Connected to NeonDB successfully');
    const migrations = await dataSource.query('SELECT * FROM migrations;');
    console.log('Migrations:', migrations);
    await dataSource.destroy();
  } catch (error) {
    console.error('Connection error:', error);
  }
}
test();
