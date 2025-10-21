import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Subject } from 'rxjs';
import * as WebSocket from 'ws';

export interface TickerData {
  product_id: string;
  price: string;
  volume_24_h: string;
  low_24_h: string;
  high_24_h: string;
  low_52_w: string;
  high_52_w: string;
  price_percent_chg_24_h: string;
  best_bid: string;
  best_ask: string;
  best_bid_quantity: string;
  best_ask_quantity: string;
}

@Injectable()
export class CoinbaseService implements OnModuleInit {
  private ws: WebSocket;
  private readonly wsUrl = 'wss://advanced-trade-ws.coinbase.com';
  private readonly logger = new Logger(CoinbaseService.name);

  private tickerSubject = new Subject<TickerData>();
  public ticker$ = this.tickerSubject.asObservable();

  private latestTickerData: Map<string, TickerData> = new Map();

  onModuleInit() {
    this.connect();
  }

  /**
   * Obtiene el precio más reciente de un activo desde el caché.
   * @param productId Ej: 'BTC-USD'
   * @returns El precio como número, o 0 si no se encuentra.
   */
  public getCurrentPrice(productId: string): number {
    const ticker = this.latestTickerData.get(productId);
    if (ticker && ticker.price) {
      return parseFloat(ticker.price);
    }
    this.logger.warn(
      `No se encontró precio en caché para ${productId}. Devolviendo 0.`,
    );
    return 0;
  }

  public getLatestDataMap() {
    return Object.fromEntries(this.latestTickerData);
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

      if (message.events && message.events[0]?.tickers) {
        const tickers: any[] = message.events[0].tickers;

        tickers.forEach((ticker) => {
          const tickerData: TickerData = {
            product_id: ticker.product_id,
            price: ticker.price,
            volume_24_h: ticker.volume_24_h,
            high_24_h: ticker.high_24_h,
            high_52_w: ticker.high_52_w,
            best_bid: ticker.best_bid,
            best_ask: ticker.best_ask,
            low_52_w: ticker.low_52_w,
            low_24_h: ticker.low_24_h,
            price_percent_chg_24_h: ticker.price_percent_chg_24_h,
            best_bid_quantity: ticker.best_bid_quantity,
            best_ask_quantity: ticker.best_ask_quantity,
          };
          // Actualizamos el caché con el dato más reciente
          this.latestTickerData.set(tickerData.product_id, tickerData);          
          // Emitimos el dato para que el Gateway lo escuche
          this.tickerSubject.next(tickerData);
        });
      }
    });

    this.ws.on('error', (error) => {
      console.error('Coinbase WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log(
        'Coinbase WebSocket closed. Attempting to reconnect in 5 seconds...',
      );
      setTimeout(() => this.connect(), 5000);
    });
  }

  private subscribeToTickers() {
    const productIds = [
      'BTC-USD',
      'ETH-USD',
      'USDT-USD',
      'XRP-USD',
      'SOL-USD',
      'DOGE-USD',
      'ADA-USD',
      'LINK-USD',
      'AVAX-USD',
      'XLM-USD',
      'SUI-USD',
      'BCH-USD',
      'HBAR-USD',
      'LTC-USD',
      'SHIB-USD',
      'CRO-USD',
      'DOT-USD',
      'ENA-USD',
      'TAO-USD',
      'ETC-USD',
    ];

    const subscribeMsg = {
      type: 'subscribe',
      channel: 'ticker',
      product_ids: productIds,
    };

    this.ws.send(JSON.stringify(subscribeMsg));
    console.log('Subscribed to tickers for:', productIds.join(', '));
  }
}
