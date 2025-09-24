import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ActiveModule } from './active/active.module';
import { PortafolioModule } from './portafolio/portafolio.module';
import { TransactionModule } from './transaction/transaction.module';
//import { BinanceGateway } from './binance.gateway';
import { BitstampGateway } from './bitstamp.gateway';

@Module({
  imports: [UserModule,PrismaModule,AuthModule, ActiveModule, PortafolioModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService, /*BinanceGateway*/ BitstampGateway],
})
export class AppModule {}
