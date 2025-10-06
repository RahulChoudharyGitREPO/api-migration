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

  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false, 
      transform: false, 
      forbidNonWhitelisted: false, 
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
