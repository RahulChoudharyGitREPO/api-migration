import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for development
    credentials: true,
  });

  // Remove api-root prefix to match Express setup
  // app.setGlobalPrefix('api-root');

  // Enable validation pipes globally
  // Note: Express doesn't validate extra fields, so we set forbidNonWhitelisted: false for compatibility
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, // Allow extra fields (Express compatibility)
      transform: true,
      forbidNonWhitelisted: false, // Don't reject extra fields
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
