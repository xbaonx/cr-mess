import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('swap')
export class SwapController {
  constructor(private readonly walletService: WalletService) {}

  @Post('request')
  async request(@Body() body: { userId: string; fromToken: string; toToken: string; amount: string; pin: string }) {
    try {
      if (!body?.userId || !body?.fromToken || !body?.toToken || !body?.amount || !body?.pin) {
        throw new HttpException('INVALID_BODY', HttpStatus.BAD_REQUEST);
      }
      const res = await this.walletService.swapRequest(body);
      return res;
    } catch (e: any) {
      if (e?.message === 'WALLET_NOT_FOUND') {
        throw new HttpException('WALLET_NOT_FOUND', HttpStatus.NOT_FOUND);
      }
      if (e?.message === 'INVALID_PIN') {
        throw new HttpException('INVALID_PIN', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(e?.message || 'FAILED', HttpStatus.BAD_REQUEST);
    }
  }
}
