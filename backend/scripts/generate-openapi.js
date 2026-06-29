const fs = require('fs');
const path = require('path');

// Booting AppModule instantiates every provider, including TokenCipherService,
// whose constructor fail-fasts when TOKEN_ENCRYPTION_KEY is unset. Generating
// the API contract never performs real encryption, so supply a throwaway
// 32-byte key when none is provided (e.g. in CI, which has no .env). This keeps
// the runtime fail-fast intact while letting build-time spec generation run.
if (!process.env.TOKEN_ENCRYPTION_KEY) {
  process.env.TOKEN_ENCRYPTION_KEY = Buffer.alloc(32).toString('base64');
}

const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { AppModule } = require('../dist/src/app.module');

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Synqer API')
      .setDescription('Generated API contract')
      .setVersion('1.0.0')
      .build(),
  );

  const outDir = path.resolve(__dirname, '../openapi');
  const outFile = path.join(outDir, 'openapi.json');

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  console.log(`OpenAPI spec written to ${outFile}`);
}

generate().catch((error) => {
  console.error('Failed to generate OpenAPI spec:', error);
  process.exit(1);
});
