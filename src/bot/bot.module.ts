import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MezonModule } from 'src/mezon/mezon.module';

// Các dịch vụ
import { CommandService } from './services/command.service';
import { BugService } from './services/bug.service';
import { SolutionService } from './services/solution.service';
import { SearchService } from './services/search.service';

// Các thực thể
import { Command } from './models/command.entity';
import { Bug } from './models/bug.entity';
import { Solution } from './models/solution.entity';

// Các lệnh
import { CommandBotCommand } from './commands/command/command.command';
import { BugCommand } from './commands/bug/bug.command';
import { SolutionCommand } from './commands/solution/solution.command';
import { SearchCommand } from './commands/search/search.command';
import { HelpCommand } from './commands/help/help.command';
import { PingCommand } from './commands/ping/ping.command';

// Các listener
import { ListenerChannelMessage } from './listeners/onChannelMessage.listener';
import { ListenerMessageButtonClicked } from './listeners/onMessageButtonClicked.listener';
import { BotGateway } from './events/bot.gateways';
import { CommandBase } from './base/command.handle';

@Module({
  imports: [TypeOrmModule.forFeature([Command, Bug, Solution]), MezonModule],
  providers: [
    // Core
    BotGateway,
    CommandBase,

    // Services
    CommandService,
    BugService,
    SolutionService,
    SearchService,

    // Commands
    CommandBotCommand,
    BugCommand,
    SolutionCommand,
    SearchCommand,
    HelpCommand,
    PingCommand,

    // Listeners
    ListenerChannelMessage,
    ListenerMessageButtonClicked,
  ],
})
export class BotModule {}