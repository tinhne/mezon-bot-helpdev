import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { BotGateway } from './bot/events/bot.gateways';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly botGateway: BotGateway
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('/reset-bot')
  async resetBot() {
    try {
      const success = await this.botGateway.resetBot();
      return { 
        success, 
        message: success ? 'Bot restarted successfully' : 'Bot restart failed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  @Get('/bot-status')
  async getBotStatus() {
    try {
      const client = this.botGateway['client']; // Access private property
      return {
        status: 'online',
        connectionInfo: {
          hasServers: !!client.servers,
          hasClans: !!(client as any).clans,
          hasUser: !!client.user,
          clanCount: (client as any).clans?.size,
          serverCount: client.servers?.size
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}