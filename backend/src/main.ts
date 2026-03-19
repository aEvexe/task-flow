import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('frontendUrl');

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('API for the TaskFlow task management application')
    .setVersion('1.0')
    .addCookieAuth('accessToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('port');
  const env = configService.get<string>('NODE_ENV') || 'development';
  const baseUrl = configService.get<string>('baseUrl');
  await app.listen(port!);

  console.log(`======================================`);
  console.log(`                                     `);
  console.log(`           ENV: ${env}               `);
  console.log(`🚀 Server is running on PORT: ${port}`);
  console.log(`                                     `);
  console.log(`======================================`);
  console.log(`                                     `);
  console.log(`======================================`);
  console.log(`                                     `);
  console.log(`           ENV: ${env}               `);
  console.log(`Swagger ${baseUrl}/api/docs          `);
  console.log(`                                     `);
  console.log(`======================================`);
}
bootstrap();
