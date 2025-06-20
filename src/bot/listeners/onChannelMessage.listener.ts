import { OnEvent } from '@nestjs/event-emitter';
import { ChannelMessage, Events, EMarkdownType } from 'mezon-sdk';
import { CommandBase } from '../base/command.handle';
import { Injectable, Logger } from '@nestjs/common';
import { BotStateService } from '../services/bot-state.service';
import { BotGateway } from '../events/bot.gateways';

@Injectable()
export class ListenerChannelMessage {
  private readonly logger = new Logger(ListenerChannelMessage.name);

  constructor(
    private commandBase: CommandBase,
    private botStateService: BotStateService,
    private botGateway: BotGateway
  ) {
    this.logger.log('ListenerChannelMessage initialized');
  }

  @OnEvent(Events.ChannelMessage)
  async handleCommand(message: ChannelMessage) {
    // Log full message details for debugging
    this.logger.debug(`Full message structure: ${JSON.stringify({
      clan_id: (message as any).clan_id, 
      server_id: message.server_id, 
      channel_id: message.channel_id,
      content: message.content
    })}`);
    
    this.logger.log(`Received message: ${message?.content?.t}`);
    
    // Skip edited messages
    if (message.code) {
      this.logger.debug('Skipping edited message');
      return;
    }
    
    try {
      const content = message?.content?.t;
      if (typeof content === 'string' && content.trim()) {
        // Handle bot control commands first
        if (content.startsWith('*deactivate') || content.startsWith('/deactivate')) {
          await this.handleDeactivation(message);
          return;
        }
        
        if (content.startsWith('*activate') || content.startsWith('/activate')) {
          await this.handleActivation(message);
          return;
        }
        
        if (content.startsWith('*botstatus') || content.startsWith('/botstatus')) {
          await this.handleBotStatus(message);
          return;
        }
        
        // Only process regular commands if bot is active
        if (this.botStateService.isActive()) {
          // Check for commands with supported prefixes (* and /)
          const firstChar = content.trim()[0];
          if (firstChar === '*' || firstChar === '/') {
            this.logger.log(`Executing command: ${content}`);
            await this.commandBase.execute(content, message);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
    }
  }
  
  // Handle bot deactivation
  private async handleDeactivation(message: ChannelMessage) {
    const messageChannel = await this.getMessageChannel(message);
    if (!messageChannel) return;
    
    // Check if already inactive
    if (!this.botStateService.isActive()) {
      await messageChannel.reply({
        t: '❌ Bot đã ở trạng thái không hoạt động.',
        mk: [{ type: EMarkdownType.PRE, s: 0, e: 38 }],
      });
      return;
    }
    
    // Extract reason if provided
    const content = message?.content?.t || '';
    const reason = content.split(' ').slice(1).join(' ') || 'Được tắt bằng lệnh thủ công';
    
    // Deactivate the bot
    await this.botGateway.deactivateBot(reason);
    
    // Send confirmation
    await messageChannel.reply({
      t: `🛑 Bot đã tạm dừng hoạt động.\nLý do: ${reason}\n\nGõ *activate để kích hoạt lại bot.`,
      mk: [{ type: EMarkdownType.PRE, s: 0, e: 50 + reason.length }],
    });
  }
  
  // Handle bot activation
  private async handleActivation(message: ChannelMessage) {
    const messageChannel = await this.getMessageChannel(message);
    if (!messageChannel) return;
    
    // Check if already active
    if (this.botStateService.isActive()) {
      await messageChannel.reply({
        t: '✅ Bot đã đang hoạt động.',
        mk: [{ type: EMarkdownType.PRE, s: 0, e: 24 }],
      });
      return;
    }
    
    // Activate the bot
    const success = await this.botGateway.activateBot();
    
    // Send confirmation
    if (success) {
      await messageChannel.reply({
        t: '✅ Bot đã được kích hoạt và sẵn sàng nhận lệnh!',
        mk: [{ type: EMarkdownType.PRE, s: 0, e: 38 }],
      });
    } else {
      await messageChannel.reply({
        t: `❌ Kích hoạt bot thất bại: ${this.botStateService.getInactiveReason()}`,
        mk: [{ type: EMarkdownType.PRE, s: 0, e: 30 + this.botStateService.getInactiveReason().length }],
      });
    }
  }
  
  // Handle bot status request
  private async handleBotStatus(message: ChannelMessage) {
    const messageChannel = await this.getMessageChannel(message);
    if (!messageChannel) return;
    
    const status = this.botGateway.getBotStatus();
    const stateEmoji = status.state === 'active' ? '🟢' : 
                      status.state === 'inactive' ? '🔴' : 
                      status.state === 'reconnecting' ? '🟡' : '🟠';
    
    const statusText = `${stateEmoji} Bot DevHelper Status\n` +
                      `Trạng thái: ${status.state}\n` +
                      `Từ: ${new Date(status.since).toLocaleString()}\n` +
                      `Prefix: ${status.commandPrefix}\n` +
                      `Số server: ${status.connectionInfo.clanCount || status.connectionInfo.serverCount || 0}\n` +
                      (status.state !== 'active' ? `Lý do: ${status.inactiveReason}\n` : '') +
                      `\nSử dụng *activate để kích hoạt hoặc *deactivate để tắt bot.`;
    
    await messageChannel.reply({
      t: statusText,
      mk: [{ type: EMarkdownType.PRE, s: 0, e: statusText.length }],
    });
  }
  
  // Helper to get message channel
  private async getMessageChannel(message: ChannelMessage) {
    try {
      const client = this.botGateway['client']; // Access private client
      const serverId = message.server_id || (message as any).clan_id;
      const channelId = message.channel_id;
      
      if ((client as any).clans) {
        const clan = (client as any).clans.get(serverId);
        if (clan) {
          const channel = await clan.channels.fetch(channelId);
          if (channel) {
            return { 
              reply: async (options: any) => {
                return await channel.messages.create(options);
              }
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error getting message channel: ${error.message}`);
      return null;
    }
  }
}