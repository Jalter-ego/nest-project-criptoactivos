import { Module } from '@nestjs/common';
import { PortafolioService } from './portafolio.service';
import { PortafolioController } from './portafolio.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PortafolioController],
  providers: [PortafolioService],
})
export class PortafolioModule {}
