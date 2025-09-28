import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { CoinbaseService, TickerData } from './coinbase/coinbase.service';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, deberías restringir esto a tu dominio del frontend
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private tickerSubscription: Subscription;

  constructor(private readonly coinbaseService: CoinbaseService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway Initialized');
    this.tickerSubscription = this.coinbaseService.ticker$.subscribe(
      (ticker: TickerData) => {
        this.server.emit('new_ticker', ticker);
      },
    );
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  onApplicationShutdown(signal?: string) {
    if (this.tickerSubscription) {
        this.tickerSubscription.unsubscribe();
    }
  }
}