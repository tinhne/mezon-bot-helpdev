import { Injectable, Logger } from '@nestjs/common';
import { MezonClientService } from 'src/mezon/services/mezon-client.service';
import { MezonClient } from 'mezon-sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;

  constructor(
    private readonly clientService: MezonClientService,
    private eventEmitter: EventEmitter2,
  ) {
    this.client = this.clientService.getClient();
  }

  async initEvent() {
    // Khi nhận được tin nhắn từ channel
    this.client.on('channelMessage', (message) => {
      this.eventEmitter.emit('channel.message', message);
    });

    // Khi có người nhấn button
    this.client.on('messageButtonClicked', (message) => {
      this.eventEmitter.emit('message.button.clicked', message);
    });

    this.logger.log('Bot events initialized successfully');
  }
}