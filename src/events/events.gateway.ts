import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { CoinbaseService, TickerData } from './coinbase/coinbase.service';

@WebSocketGateway({
  cors: {
    origin: '*', 
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
        this.server.to(ticker.product_id).emit('ticker_update', ticker);
      },
    );
  }


  @SubscribeMessage('subscribe_to_active')
  handleSubscription(
    @MessageBody() productId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (productId && typeof productId === 'string') {
      client.join(productId);
      console.log(`Client ${client.id} joined room: ${productId}`);

      client.emit('subscribed_successfully', `Subscribed to ${productId}`);
    }
  }

  @SubscribeMessage('unsubscribe_from_active')
  handleUnsubscription(
    @MessageBody() productId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (productId && typeof productId === 'string') {
      client.leave(productId); 
      console.log(`Client ${client.id} left room: ${productId}`);
    }
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