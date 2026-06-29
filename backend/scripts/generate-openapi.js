const fs = require('fs');
const path = require('path');

// Booting AppModule instantiates every provider and runs env validation, both
// of which fail-fast on missing secrets. Generating the API contract never
// touches real config, so skip env validation and stub the one provider that
// fail-fasts at construction time (TokenCipherService). This keeps the runtime
// fail-fast intact while letting build-time spec generation run without a .env
// (e.g. in CI).
process.env.SKIP_ENV_VALIDATION = 'true';
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
