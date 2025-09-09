import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('save-created')
  async saveCreated(
    @Body() body: { userId: string; encryptedMnemonic: string; walletAddress: string; pin: string },
  ) {
    try {
      if (!body?.userId || !body?.encryptedMnemonic || !body?.walletAddress || !body?.pin) {
        throw new HttpException('INVALID_BODY', HttpStatus.BAD_REQUEST);
      }
      const data = await this.walletService.saveCreated(body);
      return { ok: true, userId: data.userId };
    } catch (e: any) {
      throw new HttpException(e?.message || 'FAILED', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('import')
  async importWallet(
    @Body() body: { userId: string; encryptedMnemonic: string; walletAddress: string; pin: string },
  ) {
    try {
      if (!body?.userId || !body?.encryptedMnemonic || !body?.walletAddress || !body?.pin) {
        throw new HttpException('INVALID_BODY', HttpStatus.BAD_REQUEST);
      }
      const data = await this.walletService.importWallet(body);
      return { ok: true, userId: data.userId };
    } catch (e: any) {
      throw new HttpException(e?.message || 'FAILED', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('change-pin')
  async changePin(@Body() body: { userId: string; oldPin: string; newPin: string }) {
    try {
      if (!body?.userId || !body?.oldPin || !body?.newPin) {
        throw new HttpException('INVALID_BODY', HttpStatus.BAD_REQUEST);
      }
      await this.walletService.changePin(body);
      return { ok: true };
    } catch (e: any) {
      if (e?.message === 'WALLET_NOT_FOUND') {
        throw new HttpException('WALLET_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      if (e?.message === 'INVALID_OLD_PIN') {
        throw new HttpException('INVALID_OLD_PIN', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(e?.message || 'FAILED', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('info')
  async info(@Query('uid') uid?: string) {
    try {
      if (!uid) throw new HttpException('MISSING_UID', HttpStatus.BAD_REQUEST);
      const info = await this.walletService.getInfo(uid);
      return info;
    } catch (e: any) {
      if (e?.message === 'WALLET_NOT_FOUND') {
        throw new HttpException('WALLET_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(e?.message || 'FAILED', HttpStatus.BAD_REQUEST);
    }
  }
}
