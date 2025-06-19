import { Command } from 'src/bot/base/commandRegister.decorator';
import { CommandMessage } from 'src/bot/base/command.abstract';
import { ChannelMessage, EMarkdownType } from 'mezon-sdk';
import { SearchService } from 'src/bot/services/search.service';
import { MezonClientService } from 'src/mezon/services/mezon-client.service';
import { getRandomColor } from 'src/bot/utils/helps';
import { ButtonAction, ButtonStyle, MessageComponentType } from 'src/bot/constants/types';
import { ActionRowComponent, ButtonComponent } from 'src/bot/constants/interfaces';

@Command('search')
export class SearchCommand extends CommandMessage {
  constructor(
    private searchService: SearchService,
    clientService: MezonClientService,
  ) {
    super(clientService);
  }

  async execute(args: string[], message: ChannelMessage): Promise<any> {
    const messageChannel = await this.getChannelMessage(message);
    if (!messageChannel) return;

    if (args.length === 0) {
      return this.showHelp(messageChannel);
    }

    const type = args[0].toLowerCase();
    
    if (type === 'commands' || type === 'bugs' || type === 'solutions') {
      // Tìm kiếm theo loại cụ thể
      return this.handleTypeSearch(type, args.slice(1), messageChannel);
    } else {
      // Nếu không phải là loại cụ thể, coi như tìm kiếm tất cả với từ khóa là tất cả args
      return this.handleGenericSearch(args, messageChannel);
    }
  }

  private async showHelp(messageChannel: any): Promise<any> {
    return messageChannel.reply({
      t: '🔍 Hướng dẫn sử dụng lệnh search:',
      embed: [
        {
          color: getRandomColor(),
          title: 'DevHelper - Search Help',
          description: 'Tìm kiếm thông tin trong hệ thống:',
          fields: [
            {
              name: '/search [query]',
              value: 'Tìm kiếm tất cả các loại (command, bug, solution) với từ khóa\n' +
                    'Ví dụ: `/search git commit`',
            },
            {
              name: '/search commands [query]',
              value: 'Tìm kiếm chỉ các lệnh\n' +
                    'Ví dụ: `/search commands stash`',
            },
            {
              name: '/search bugs [query]',
              value: 'Tìm kiếm chỉ các bug\n' +
                    'Ví dụ: `/search bugs token`',
            },
            {
              name: '/search solutions [query]',
              value: 'Tìm kiếm chỉ các giải pháp\n' +
                    'Ví dụ: `/search solutions authentication`',
            },
          ],
          footer: {
            text: 'DevHelper Bot',
          },
        },
      ],
    });
  }

  private async handleGenericSearch(args: string[], messageChannel: any): Promise<any> {
    if (args.length === 0) {
      return messageChannel.reply({
        t: '❌ Thiếu từ khóa tìm kiếm!',
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: '❌ Thiếu từ khóa tìm kiếm!'.length,
          },
        ],
      });
    }

    const query = args.join(' ');
    
    try {
      // Tìm kiếm đa loại
      const results = await this.searchService.search(query);

      if (results.commands.length === 0 && results.bugs.length === 0 && results.solutions.length === 0) {
        return messageChannel.reply({
          t: `🔍 Không tìm thấy kết quả nào cho "${query}".`,
          mk: [
            {
              type: EMarkdownType.PRE,
              s: 0,
              e: `🔍 Không tìm thấy kết quả nào cho "${query}".`.length,
            },
          ],
        });
      }

      // Tạo nội dung hiển thị kết quả
      let resultText = `🔍 Kết quả tìm kiếm cho "${query}":\n\n`;
      
      // Hiển thị lệnh
      if (results.commands.length > 0) {
        resultText += `📝 LỆNH (${results.commands.length}):\n`;
        results.commands.slice(0, 5).forEach((cmd, index) => {
          resultText += `${index + 1}. #${cmd.id}: ${cmd.title} - ${cmd.description || 'Không có mô tả'}\n`;
        });
        if (results.commands.length > 5) {
          resultText += `... và ${results.commands.length - 5} lệnh khác\n`;
        }
        resultText += '\n';
      }
      
      // Hiển thị bug
      if (results.bugs.length > 0) {
        resultText += `🐛 BUG (${results.bugs.length}):\n`;
        results.bugs.slice(0, 5).forEach((bug, index) => {
          resultText += `${index + 1}. #${bug.id}: ${bug.title} - ${bug.status} (${bug.severity})\n`;
        });
        if (results.bugs.length > 5) {
          resultText += `... và ${results.bugs.length - 5} bug khác\n`;
        }
        resultText += '\n';
      }
      
      // Hiển thị giải pháp
      if (results.solutions.length > 0) {
        resultText += `💡 GIẢI PHÁP (${results.solutions.length}):\n`;
        results.solutions.slice(0, 5).forEach((solution, index) => {
          resultText += `${index + 1}. #${solution.id}: ${solution.title} - Bug: #${solution.bug.id}\n`;
        });
        if (results.solutions.length > 5) {
          resultText += `... và ${results.solutions.length - 5} giải pháp khác\n`;
        }
      }

      // Tạo các button để xem chi tiết
      const commandButtons: ButtonComponent[] = [];
      const bugButtons: ButtonComponent[] = [];
      const solutionButtons: ButtonComponent[] = [];
      
      for (let i = 0; i < Math.min(3, results.commands.length); i++) {
        commandButtons.push({
          type: MessageComponentType.BUTTON,
          style: ButtonStyle.BLUE,
          label: `Command #${results.commands[i].id}`,
          custom_id: `${ButtonAction.VIEW}:command:${results.commands[i].id}`,
        } as ButtonComponent);
      }
      
      for (let i = 0; i < Math.min(3, results.bugs.length); i++) {
        bugButtons.push({
          type: MessageComponentType.BUTTON,
          style: ButtonStyle.RED,
          label: `Bug #${results.bugs[i].id}`,
          custom_id: `${ButtonAction.VIEW}:bug:${results.bugs[i].id}`,
        } as ButtonComponent);
      }
      
      for (let i = 0; i < Math.min(3, results.solutions.length); i++) {
        solutionButtons.push({
          type: MessageComponentType.BUTTON,
          style: ButtonStyle.GREEN,
          label: `Solution #${results.solutions[i].id}`,
          custom_id: `${ButtonAction.VIEW}:solution:${results.solutions[i].id}`,
        } as ButtonComponent);
      }
      
      const actionRows: ActionRowComponent[] = [];
      
      if (commandButtons.length > 0) {
        actionRows.push({
          type: MessageComponentType.ACTION_ROW,
          components: commandButtons,
        } as ActionRowComponent);
      }
      
      if (bugButtons.length > 0) {
        actionRows.push({
          type: MessageComponentType.ACTION_ROW,
          components: bugButtons,
        } as ActionRowComponent);
      }
      
      if (solutionButtons.length > 0) {
        actionRows.push({
          type: MessageComponentType.ACTION_ROW,
          components: solutionButtons,
        } as ActionRowComponent);
      }

      return messageChannel.reply({
        t: resultText,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: resultText.length,
          },
        ],
        components: actionRows,
      } as any);
    } catch (error) {
      return messageChannel.reply({
        t: `❌ Lỗi khi tìm kiếm: ${error.message}`,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: `❌ Lỗi khi tìm kiếm: ${error.message}`.length,
          },
        ],
      });
    }
  }

  private async handleTypeSearch(type: string, args: string[], messageChannel: any): Promise<any> {
    if (args.length === 0) {
      return messageChannel.reply({
        t: '❌ Thiếu từ khóa tìm kiếm!',
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: '❌ Thiếu từ khóa tìm kiếm!'.length,
          },
        ],
      });
    }

    const query = args.join(' ');
    
    try {
      // Tìm kiếm theo loại
      const results = await this.searchService.searchByType(query, type);
      
      if (results.length === 0) {
        return messageChannel.reply({
          t: `🔍 Không tìm thấy ${this.getTypeDisplayName(type)} nào cho "${query}".`,
          mk: [
            {
              type: EMarkdownType.PRE,
              s: 0,
              e: `🔍 Không tìm thấy ${this.getTypeDisplayName(type)} nào cho "${query}".`.length,
            },
          ],
        });
      }

      // Tạo nội dung hiển thị kết quả
      let resultText = `🔍 Kết quả tìm kiếm ${this.getTypeDisplayName(type)} cho "${query}":\n\n`;
      
      results.forEach((item, index) => {
        if (type === 'commands') {
          resultText += `${index + 1}. #${item.id}: ${item.title} - ${item.description || 'Không có mô tả'}\n`;
        } else if (type === 'bugs') {
          const solutionCount = item.solutions ? item.solutions.length : 0;
          resultText += `${index + 1}. #${item.id}: ${item.title} - ${item.status} (${item.severity})${solutionCount > 0 ? ` - ${solutionCount} giải pháp` : ''}\n`;
        } else if (type === 'solutions') {
          resultText += `${index + 1}. #${item.id}: ${item.title} - Bug: #${item.bug.id} - ${item.bug.title}\n`;
        }
      });

      // Tạo các button để xem chi tiết
      const buttons: ButtonComponent[] = [];
      for (let i = 0; i < Math.min(5, results.length); i++) {
        buttons.push({
          type: MessageComponentType.BUTTON,
          style: this.getButtonStyleForType(type),
          label: `Xem #${results[i].id}`,
          custom_id: `${ButtonAction.VIEW}:${this.getSingularType(type)}:${results[i].id}`,
        } as ButtonComponent);
      }
      
      const actionRow: ActionRowComponent = {
        type: MessageComponentType.ACTION_ROW,
        components: buttons,
      } as ActionRowComponent;

      return messageChannel.reply({
        t: resultText,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: resultText.length,
          },
        ],
        components: [actionRow],
      } as any);
    } catch (error) {
      return messageChannel.reply({
        t: `❌ Lỗi khi tìm kiếm: ${error.message}`,
        mk: [
          {
            type: EMarkdownType.PRE,
            s: 0,
            e: `❌ Lỗi khi tìm kiếm: ${error.message}`.length,
          },
        ],
      });
    }
  }

  // Helper methods
  private getTypeDisplayName(type: string): string {
    switch (type) {
      case 'commands':
        return 'lệnh';
      case 'bugs':
        return 'bug';
      case 'solutions':
        return 'giải pháp';
      default:
        return type;
    }
  }

  private getSingularType(type: string): string {
    switch (type) {
      case 'commands':
        return 'command';
      case 'bugs':
        return 'bug';
      case 'solutions':
        return 'solution';
      default:
        return type;
    }
  }

  private getButtonStyleForType(type: string): ButtonStyle {
    switch (type) {
      case 'commands':
        return ButtonStyle.BLUE;
      case 'bugs':
        return ButtonStyle.RED;
      case 'solutions':
        return ButtonStyle.GREEN;
      default:
        return ButtonStyle.BLUE;
    }
  }
}