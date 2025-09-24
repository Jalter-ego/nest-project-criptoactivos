// src/bitstamp/bitstamp.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import {WebSocket} from 'ws';

@WebSocketGateway({ cors: true }) // Permite conexiones desde React
export class BitstampGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private bitstampSocket: WebSocket;

  afterInit() {
    this.connectBitstamp();
  }

  handleConnection(client: any) {
    console.log('Cliente conectado:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Cliente desconectado:', client.id);
  }

  private connectBitstamp() {
    this.bitstampSocket = new WebSocket('wss://ws.bitstamp.net');

    this.bitstampSocket.on('open', () => {
      console.log('Conectado a Bitstamp WebSocket');
      this.bitstampSocket.send(JSON.stringify({
        event: 'bts:subscribe',
        data: { channel: 'live_trades_btcusd' }
      }));
    });

    this.bitstampSocket.on('message', (msg: string) => {
      const message = JSON.parse(msg);
      if (message.event === 'trade') {
        const tradeData = {
          price: message.data.price,
          amount: message.data.amount,
          timestamp: message.data.timestamp
        };
        this.server.emit('trade', tradeData); // Enviamos a todos los clientes conectados
      }
    });

    this.bitstampSocket.on('close', () => {
      console.log('Bitstamp WebSocket cerrado, reconectando en 5s...');
      setTimeout(() => this.connectBitstamp(), 5000);
    });

    this.bitstampSocket.on('error', (err) => {
      console.error('Error en Bitstamp WebSocket:', err);
    });
  }
}
