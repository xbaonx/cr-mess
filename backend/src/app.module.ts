import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { SwapController } from './swap.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [],
  controllers: [WalletController, SwapController],
  providers: [WalletService],
})
export class AppModule {}
