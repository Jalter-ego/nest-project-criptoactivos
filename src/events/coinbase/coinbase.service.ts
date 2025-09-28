import { Injectable, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as WebSocket from 'ws';

export interface TickerData {
  product_id: string;
  price: string;
  volume_24_h: string;
}

@Injectable()
export class CoinbaseService implements OnModuleInit {
  private ws: WebSocket;
  private readonly wsUrl = 'wss://advanced-trade-ws.coinbase.com';
  
  // Usaremos un Subject de RxJS para emitir eventos de forma interna
  private tickerSubject = new Subject<TickerData>();
  
  // El Gateway se suscribirá a este Observable
  public ticker$ = this.tickerSubject.asObservable();

  onModuleInit() {
    this.connect();
  }

  private connect() {
    console.log('Connecting to Coinbase WebSocket...');
    this.ws = new WebSocket(this.wsUrl);

    this.ws.on('open', () => {
      console.log('Successfully connected to Coinbase WebSocket.');
      this.subscribeToTickers();
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      const message = JSON.parse(data.toString());
      
      // La API de ticker envía eventos en un array 'events'
      if (message.events && message.events[0]?.tickers) {
        const tickers: any[] = message.events[0].tickers;
        
        tickers.forEach(ticker => {
            console.log(ticker);
            
            // Filtramos solo  datos que nos interesan
            const tickerData: TickerData = {
                product_id: ticker.product_id,
                price: ticker.price,
                volume_24_h: ticker.volume_24_h
            };
            // Emitimos el dato para que el Gateway lo escuche
            this.tickerSubject.next(tickerData);
        });
      }
    });

    this.ws.on('error', (error) => {
      console.error('Coinbase WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Coinbase WebSocket closed. Attempting to reconnect in 5 seconds...');
      setTimeout(() => this.connect(), 5000); // Intenta reconectar si se cierra
    });
  }

  private subscribeToTickers() {
    const productIds = [
      "BTC-USD", "ETH-USD", "SOL-USD", "ADA-USD", "DOGE-USD",
      "AVAX-USD", "MATIC-USD", "XRP-USD", "DOT-USD",
    ];
    
    const subscribeMsg = {
      type: 'subscribe',
      channel: 'ticker',
      product_ids: productIds,
      // Aquí podrías añadir tu clave de API si la necesitaras para canales privados
      // api_key: "...",
      // signature: "...",
      // timestamp: "..."
    };

    this.ws.send(JSON.stringify(subscribeMsg));
    console.log('Subscribed to tickers for:', productIds.join(', '));
  }
}