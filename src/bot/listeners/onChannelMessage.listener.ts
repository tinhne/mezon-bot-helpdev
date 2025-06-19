import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events } from 'mezon-sdk';
import { CommandBase } from '../base/command.handle';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ListenerChannelMessage {
  constructor(private commandBase: CommandBase) {
      console.log('ListenerChannelMessage initialized');
  }

  @OnEvent(Events.ChannelMessage)
  async handleCommand(message: ChannelMessage) {
    console.log('Received message:', message.content?.t); // Thêm dòng này
    if (message.code) return; // Do not support case edit message
    try {
      const content = message.content.t;
      if (typeof content == 'string' && content.trim()) {
        const firstLetter = content.trim()[0];
        switch (firstLetter) {
          case '*':
            await this.commandBase.execute(content, message);
            break;
          default:
            return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}
