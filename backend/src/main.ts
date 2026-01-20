import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AdminAuthService } from './admin-auth/admin-auth.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for web application
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://localhost:5175', // Admin dashboard
      'http://localhost:5176',
      process.env.WEB_APP_URL || 'http://localhost:5173',
      process.env.ADMIN_APP_URL || 'http://localhost:5175',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });
  
  app.setGlobalPrefix('api');
  
  // Ensure default admin exists
  const adminAuthService = app.get(AdminAuthService);
  await adminAuthService.ensureDefaultAdmin();
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server listening on http://localhost:${port}/api`);
}

bootstrap();
