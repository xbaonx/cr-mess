import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  // Enable CORS (allow all for simplicity). In production, set ALLOWED_ORIGINS env.
  const allowed = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({ origin: allowed && allowed.length > 0 ? allowed : true });

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`);
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap backend', e);
  process.exit(1);
});
