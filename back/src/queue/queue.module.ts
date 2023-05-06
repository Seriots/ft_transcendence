import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { GameService } from 'src/game/game.service';
import { QueueGateway } from './queue.gateway';

@Module({
  providers: [QueueService, Array, GameService, QueueGateway],
  controllers: [QueueController]
})
export class QueueModule {}