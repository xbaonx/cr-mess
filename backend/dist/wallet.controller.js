"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async saveCreated(body) {
        try {
            if (!(body === null || body === void 0 ? void 0 : body.userId) || !(body === null || body === void 0 ? void 0 : body.encryptedMnemonic) || !(body === null || body === void 0 ? void 0 : body.walletAddress) || !(body === null || body === void 0 ? void 0 : body.pin)) {
                throw new common_1.HttpException('INVALID_BODY', common_1.HttpStatus.BAD_REQUEST);
            }
            const data = await this.walletService.saveCreated(body);
            return { ok: true, userId: data.userId };
        }
        catch (e) {
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'FAILED', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async importWallet(body) {
        try {
            if (!(body === null || body === void 0 ? void 0 : body.userId) || !(body === null || body === void 0 ? void 0 : body.encryptedMnemonic) || !(body === null || body === void 0 ? void 0 : body.walletAddress) || !(body === null || body === void 0 ? void 0 : body.pin)) {
                throw new common_1.HttpException('INVALID_BODY', common_1.HttpStatus.BAD_REQUEST);
            }
            const data = await this.walletService.importWallet(body);
            return { ok: true, userId: data.userId };
        }
        catch (e) {
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'FAILED', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async changePin(body) {
        try {
            if (!(body === null || body === void 0 ? void 0 : body.userId) || !(body === null || body === void 0 ? void 0 : body.oldPin) || !(body === null || body === void 0 ? void 0 : body.newPin)) {
                throw new common_1.HttpException('INVALID_BODY', common_1.HttpStatus.BAD_REQUEST);
            }
            await this.walletService.changePin(body);
            return { ok: true };
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.message) === 'WALLET_NOT_FOUND') {
                throw new common_1.HttpException('WALLET_NOT_FOUND', common_1.HttpStatus.NOT_FOUND);
            }
            if ((e === null || e === void 0 ? void 0 : e.message) === 'INVALID_OLD_PIN') {
                throw new common_1.HttpException('INVALID_OLD_PIN', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'FAILED', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async info(uid) {
        try {
            if (!uid)
                throw new common_1.HttpException('MISSING_UID', common_1.HttpStatus.BAD_REQUEST);
            const info = await this.walletService.getInfo(uid);
            return info;
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.message) === 'WALLET_NOT_FOUND') {
                throw new common_1.HttpException('WALLET_NOT_FOUND', common_1.HttpStatus.NOT_FOUND);
            }
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'FAILED', common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('save-created'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "saveCreated", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "importWallet", null);
__decorate([
    (0, common_1.Post)('change-pin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "changePin", null);
__decorate([
    (0, common_1.Get)('info'),
    __param(0, (0, common_1.Query)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "info", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map