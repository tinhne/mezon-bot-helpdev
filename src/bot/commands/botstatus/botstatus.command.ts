import { ChannelMessage, EMarkdownType } from 'mezon-sdk';
import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from 'src/bot/base/command.abstract';
import { MezonClientService } from 'src/mezon/services/mezon-client.service';
import { BotStateService } from '../../services/bot-state.service';
import { BotGateway } from '../../events/bot.gateways';
import { Injectable } from '@nestjs/common';

@Command('botstatus')
@Injectable()
export class BotstatusCommand extends CommandMessage {
  constructor(
    clientService: MezonClientService,
    private botStateService: BotStateService,
    private botGateway: BotGateway
  ) {
    super(clientService);
  }

  async execute(args: string[], message: ChannelMessage): Promise<any> {
    const messageChannel = await this.getChannelMessage(message);
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
}