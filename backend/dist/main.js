"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    var _a;
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { logger: ['log', 'error', 'warn'] });
    const allowed = (_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',').map((s) => s.trim()).filter(Boolean);
    app.enableCors({ origin: allowed && allowed.length > 0 ? allowed : true });
    const port = parseInt(process.env.PORT || '3001', 10);
    await app.listen(port, '0.0.0.0');
    console.log(`Backend listening on port ${port}`);
}
bootstrap().catch((e) => {
    console.error('Failed to bootstrap backend', e);
    process.exit(1);
});
//# sourceMappingURL=main.js.map