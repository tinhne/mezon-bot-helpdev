import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { CommandBase } from '../base/command.handle';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ListenerChannelMessage {
  private readonly logger = new Logger(ListenerChannelMessage.name);

  constructor(private commandBase: CommandBase) {
      this.logger.log('ListenerChannelMessage initialized');
  }

@OnEvent(Events.ChannelMessage)
async handleCommand(message: ChannelMessage) {
  // Log đầy đủ thông tin message để debug
  this.logger.debug(`Full message structure: ${JSON.stringify({
    clan_id: (message as any).clan_id, 
    server_id: message.server_id, 
    channel_id: message.channel_id,
    content: message.content
  })}`);
  
  this.logger.log(`Received message: ${message?.content?.t}`);
  
  // Tiếp tục xử lý như bình thường
  if (message.code) {
    this.logger.debug('Skipping edited message');
    return;
  }
  
  try {
    const content = message.content?.t;
    if (typeof content === 'string' && content.trim()) {
      // Check for all supported command prefixes (* and /)
      const firstChar = content.trim()[0];
      if (firstChar === '*' || firstChar === '/') {
        this.logger.log(`Executing command: ${content}`);
        await this.commandBase.execute(content, message);
      }
    }
  } catch (error) {
    this.logger.error('Error handling message:', error);
  }

}}