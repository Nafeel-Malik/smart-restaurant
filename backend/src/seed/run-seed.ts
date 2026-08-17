import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

/**
 * Manual local-dev seeder only. Never imported by AppModule / production startup.
 * Run: npm run seed
 *
 * Optional env:
 *   SUPERADMIN_SEED_USERNAME (default: admin)
 *   SUPERADMIN_SEED_PASSWORD (default: admin123 — local dev only)
 */
async function run() {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const username = (process.env.SUPERADMIN_SEED_USERNAME || 'admin').trim();
  const password = (process.env.SUPERADMIN_SEED_PASSWORD || 'admin123').trim();

  try {
    const existing = await usersService.findByUsername(username);
    if (existing) {
      logger.log(`Super admin "${username}" already exists — skipping`);
      return;
    }

    await usersService.create({
      username,
      password: await bcrypt.hash(password, 10),
      role: 'super_admin',
      assignedRestaurant: null,
    });

    logger.log(`Default super admin created (username: "${username}"). Password is not logged.`);
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
