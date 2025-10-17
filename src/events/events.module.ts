import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { CoinbaseService } from './coinbase/coinbase.service';

@Module({
  providers: [EventsGateway, CoinbaseService],
  exports: [CoinbaseService],
})
export class EventsModule {}
