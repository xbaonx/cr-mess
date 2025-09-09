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
exports.SwapController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
let SwapController = class SwapController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async request(body) {
        try {
            if (!(body === null || body === void 0 ? void 0 : body.userId) || !(body === null || body === void 0 ? void 0 : body.fromToken) || !(body === null || body === void 0 ? void 0 : body.toToken) || !(body === null || body === void 0 ? void 0 : body.amount) || !(body === null || body === void 0 ? void 0 : body.pin)) {
                throw new common_1.HttpException('INVALID_BODY', common_1.HttpStatus.BAD_REQUEST);
            }
            const res = await this.walletService.swapRequest(body);
            return res;
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.message) === 'WALLET_NOT_FOUND') {
                throw new common_1.HttpException('WALLET_NOT_FOUND', common_1.HttpStatus.NOT_FOUND);
            }
            if ((e === null || e === void 0 ? void 0 : e.message) === 'INVALID_PIN') {
                throw new common_1.HttpException('INVALID_PIN', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'FAILED', common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.SwapController = SwapController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SwapController.prototype, "request", null);
exports.SwapController = SwapController = __decorate([
    (0, common_1.Controller)('swap'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], SwapController);
//# sourceMappingURL=swap.controller.js.map