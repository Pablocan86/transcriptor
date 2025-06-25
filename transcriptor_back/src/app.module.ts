import { Module } from '@nestjs/common';
import { AudioModule } from './audio/audio.module';
import { HttpModule } from '@nestjs/axios';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [HttpModule, AudioModule],
  controllers: [],
  providers: [EventsGateway],
})
export class AppModule {}
