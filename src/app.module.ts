import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ActiveModule } from './active/active.module';
import { PortafolioModule } from './portafolio/portafolio.module';
import { TransactionModule } from './transaction/transaction.module';
import { BitstampGateway } from './bitstamp.gateway';
import { EventsModule } from './events/events.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AiInsightsModule } from './ai-insights/ai-insights.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    UserModule,
    PrismaModule,
    AuthModule,
    ActiveModule,
    PortafolioModule,
    TransactionModule,
    EventsModule,
    FeedbackModule,
    AiInsightsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService, BitstampGateway],
})
export class AppModule {}
