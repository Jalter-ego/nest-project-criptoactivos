import { Test, TestingModule } from '@nestjs/testing';
import { EventsGateway } from './events.gateway';
import { CoinbaseService } from './coinbase/coinbase.service';

describe('EventsGateway', () => {
  let gateway: EventsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        {
          provide: CoinbaseService,
          useValue: {
            handleEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
