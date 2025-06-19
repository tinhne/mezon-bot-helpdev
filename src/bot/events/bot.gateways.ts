import { Injectable, Logger } from '@nestjs/common';
import { MezonClientService } from 'src/mezon/services/mezon-client.service';
import { MezonClient, Events } from 'mezon-sdk';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);
  private client: MezonClient;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly clientService: MezonClientService,
    private eventEmitter: EventEmitter2,
  ) {
    this.client = this.clientService.getClient();
  }

  async initEvent() {
    // Log client state khi khởi tạo
    const clientInfo = {
      hasServers: !!this.client.servers,
      hasClans: !!(this.client as any).clans,
      hasUser: !!this.client.user,
      clanCount: (this.client as any).clans?.size,
      serverCount: this.client.servers?.size
    };
    
    this.logger.log(`Bot client initialized: ${JSON.stringify(clientInfo)}`);
    
    // Thêm events cho connected và disconnected
    this.client.on('connected', () => {
      this.logger.log('Bot connected to Mezon API');
      this.reconnectAttempts = 0; // Reset số lần thử kết nối lại
    });

    this.client.on('disconnected', () => {
      this.logger.warn('Bot disconnected from Mezon API');
      // Tự động kết nối lại sau khi ngắt kết nối
      this.handleDisconnect();
    });

    // Khi nhận được tin nhắn từ channel
    this.client.on(Events.ChannelMessage, (message) => {
      const shortContent = message?.content?.t?.substring(0, 30) || '';
      this.logger.debug(`Received message: ${shortContent}... (clan_id: ${message.clan_id || message.server_id}, channel: ${message.channel_id})`);
      
      // Use consistent event name here - Events.ChannelMessage instead of 'channel.message'
      this.eventEmitter.emit(Events.ChannelMessage, message);
    });

    // Fix button click event name to match listener
    this.client.on(Events.MessageButtonClicked, (message) => {
      this.logger.debug(`Button click: ${message.custom_id} (channel: ${message.channel_id})`);
      
      // Use consistent event name
      this.eventEmitter.emit(Events.MessageButtonClicked, message);
    });

    // Xử lý lỗi kết nối
    this.client.on('error', (error) => {
      this.logger.error(`Error in Mezon client: ${error.message}`, error.stack);
      this.handleConnectionError(error);
    });

    // Kiểm tra kết nối định kỳ (5 phút)
    setInterval(async () => {
      try {
        const isConnected = await this.clientService.checkConnection();
        if (!isConnected) {
          this.logger.warn('Connection check failed, attempting to reconnect');
          await this.handleConnectionError(new Error('Connection check failed'));
        }
      } catch (error) {
        this.logger.error(`Error during connection check: ${error.message}`);
      }
    }, 5 * 60 * 1000); // 5 phút

    this.logger.log('Bot events initialized successfully');
  }

  // Xử lý mất kết nối
  private async handleDisconnect() {
    // Nếu đang có timeout reconnect thì không làm gì
    if (this.reconnectTimeout) return;
    
    this.logger.warn('Bot disconnected, attempting to reconnect');
    
    // Thử kết nối lại sau 3 giây
    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.logger.log(`Reconnect attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
          
          this.client = await this.clientService.reconnectBot();
          this.logger.log('Reconnection successful');
          
          // Khởi tạo lại các event sau khi reconnect
          await this.initEvent();
        } else {
          this.logger.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Manual intervention required.`);
        }
      } catch (error) {
        this.logger.error(`Reconnection failed: ${error.message}`);
        
        // Thử lại sau thời gian dài hơn nếu tiếp tục thất bại
        const retryTime = Math.min(30000, 3000 * Math.pow(2, this.reconnectAttempts));
        this.logger.log(`Will retry in ${retryTime / 1000} seconds...`);
        
        this.reconnectTimeout = setTimeout(() => {
          this.handleDisconnect();
        }, retryTime);
      } finally {
        this.reconnectTimeout = null;
      }
    }, 3000);
  }

  // Xử lý lỗi kết nối
  private async handleConnectionError(error: Error) {
    this.logger.error(`Bot connection error: ${error.message}`);
    
    // Thử kết nối lại sau 5 giây
    setTimeout(async () => {
      this.logger.log('Attempting to reconnect after error...');
      try {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.client = await this.clientService.reconnectBot();
          this.logger.log('Reconnection after error successful');
        } else {
          this.logger.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached after error. Manual intervention required.`);
        }
      } catch (e) {
        this.logger.error(`Reconnection after error failed: ${e.message}`);
      }
    }, 5000);
  }
  
  // Bổ sung phương thức để reset bot từ bên ngoài
  async resetBot() {
    this.logger.log('Manual bot reset initiated');
    this.reconnectAttempts = 0;
    try {
      this.client = await this.clientService.reconnectBot();
      await this.initEvent();
      return true;
    } catch (error) {
      this.logger.error(`Manual bot reset failed: ${error.message}`);
      return false;
    }
  }
}