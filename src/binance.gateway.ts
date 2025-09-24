/*import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WebSocket } from 'ws';

@WebSocketGateway({
  cors: { origin: '*' }, 
})
export class BinanceGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private binanceSocket: WebSocket;

  afterInit() {
    console.log('BinanceGateway inicializado');

    const SYMBOL = 'btcusdt';
    this.binanceSocket = new WebSocket(
      `wss://stream.binance.com:9443/ws/${SYMBOL}@trade`,
    );

    this.binanceSocket.on('message', (msg: string) => {
      const trade = JSON.parse(msg.toString());
      this.server.emit('trade', {
        price: parseFloat(trade.p),
        quantity: parseFloat(trade.q),
        time: trade.T,
      });
    });
  }

  handleConnection(client: any) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }
}
*/