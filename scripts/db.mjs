import { migrate, migrationStatus } from '../server/db/migrations.js';
import { closePool, getDatabaseUrl, getPool } from '../server/db/pool.js';

const command = process.argv[2] || 'migrate';
try {
  getDatabaseUrl();
  if (command === 'migrate') { await migrate(); console.log('Database migrations applied.'); }
  else if (command === 'status') { const state=await migrationStatus(); console.table(state.files.map(version=>({version, applied: state.applied.some(row=>row.version===version)}))); }
  else if (command === 'seed') { if (process.env.NODE_ENV !== 'development') throw new Error('Seed requires NODE_ENV=development.'); const target = new URL(getDatabaseUrl()); const database = target.pathname.slice(1); if (!database || !/^flexboard_(db|dev|development)$/.test(database)) throw new Error('Seed target must be a development database named flexboard_db, flexboard_dev, or flexboard_development.'); await migrate(); await getPool().query("INSERT INTO profiles (id, display_name, auth_subject, role) VALUES ('00000000-0000-4000-8000-000000000001','Development Fixture','dev:fixture','leader') ON CONFLICT (id) DO NOTHING"); console.log('Development seed applied.'); }
  else throw new Error('Unknown database command. Use migrate, status, or seed.');
} catch (error) { console.error(error.message); process.exitCode=1; } finally { await closePool(); }
