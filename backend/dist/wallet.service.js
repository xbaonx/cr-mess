"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const DATA_DIR = process.env.DATA_DIR || '/mnt/data';
const WALLETS_DIR = path.join(DATA_DIR, 'wallets');
async function ensureDir(dir) {
    await fs_1.promises.mkdir(dir, { recursive: true });
}
function filePath(uid) {
    return path.join(WALLETS_DIR, `${uid}.json`);
}
let WalletService = class WalletService {
    async getWallet(uid) {
        try {
            const p = filePath(uid);
            const raw = await fs_1.promises.readFile(p, 'utf8');
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async saveCreated(payload) {
        await ensureDir(WALLETS_DIR);
        const now = new Date().toISOString();
        const data = {
            userId: payload.userId,
            walletAddress: payload.walletAddress,
            encryptedMnemonic: payload.encryptedMnemonic,
            pin: payload.pin,
            tokens: [],
            createdAt: now,
            updatedAt: now,
        };
        await fs_1.promises.writeFile(filePath(payload.userId), JSON.stringify(data, null, 2));
        return data;
    }
    async importWallet(payload) {
        var _a, _b;
        const existing = await this.getWallet(payload.userId);
        const now = new Date().toISOString();
        const data = {
            userId: payload.userId,
            walletAddress: payload.walletAddress,
            encryptedMnemonic: payload.encryptedMnemonic,
            pin: payload.pin,
            tokens: (_a = existing === null || existing === void 0 ? void 0 : existing.tokens) !== null && _a !== void 0 ? _a : [],
            createdAt: (_b = existing === null || existing === void 0 ? void 0 : existing.createdAt) !== null && _b !== void 0 ? _b : now,
            updatedAt: now,
        };
        await ensureDir(WALLETS_DIR);
        await fs_1.promises.writeFile(filePath(payload.userId), JSON.stringify(data, null, 2));
        return data;
    }
    async changePin(payload) {
        const w = await this.getWallet(payload.userId);
        if (!w)
            throw new Error('WALLET_NOT_FOUND');
        if (w.pin !== payload.oldPin)
            throw new Error('INVALID_OLD_PIN');
        w.pin = payload.newPin;
        w.updatedAt = new Date().toISOString();
        await ensureDir(WALLETS_DIR);
        await fs_1.promises.writeFile(filePath(payload.userId), JSON.stringify(w, null, 2));
        return { ok: true };
    }
    async getInfo(uid) {
        var _a, _b;
        const w = await this.getWallet(uid);
        if (!w)
            throw new Error('WALLET_NOT_FOUND');
        const totalUsd = (_a = w.tokens) === null || _a === void 0 ? void 0 : _a.reduce((acc, t) => { var _a; return acc + (Number(t.balance) * ((_a = t.priceUsd) !== null && _a !== void 0 ? _a : 0)); }, 0);
        return {
            userId: w.userId,
            walletAddress: w.walletAddress,
            tokens: (_b = w.tokens) !== null && _b !== void 0 ? _b : [],
            totalUsd: Number.isFinite(totalUsd) ? Number(totalUsd.toFixed(2)) : undefined,
        };
    }
    async swapRequest(payload) {
        const w = await this.getWallet(payload.userId);
        if (!w)
            throw new Error('WALLET_NOT_FOUND');
        if (w.pin !== payload.pin)
            throw new Error('INVALID_PIN');
        const bytes = (0, crypto_1.randomBytes)(32);
        const txHash = '0x' + bytes.toString('hex');
        return { txHash };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)()
], WalletService);
//# sourceMappingURL=wallet.service.js.map