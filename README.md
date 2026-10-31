# mezon-bot-helpdev

Working copy in which the DevHelp bot for [Mezon](https://mezon.ai) was first built. It contains the full commit history of the `mezonai/utility-mezon-bot` template, followed by the June 2025 commits that replaced the template's features with developer-helper commands.

**Status:** snapshot, no longer developed. The maintained version is [`tinhne/Devhelp-mezon`](https://github.com/tinhne/Devhelp-mezon).

## Origin of the code

Most of the history in this repository was written by other people. It was imported from [`mezonai/utility-mezon-bot`](https://github.com/mezonai/utility-mezon-bot), a NestJS Mezon bot whose commit history (pull requests #1 to #52) is preserved here unchanged.

| Period | Authors | What happened |
| --- | --- | --- |
| 2025-04-23 → 2025-06-13 | michael.mai, thai.phamquoc ([@Cut666](https://github.com/Cut666)), man2807 ([@man2807](https://github.com/man2807)), van-datncc ([@van-datncc](https://github.com/van-datncc)) | Upstream template: command framework plus casino slots, sic bo, lixi, polls, P2P token trading, welcome messages and role commands |
| 2025-06-19 | Lê Văn Trung Tính (`tms-tinhle`) | Removed the casino, lixi, poll and trading features and added the DevHelp domain: `Command`, `Bug` and `Solution` entities and services, the `command`, `bug`, `solution` and `search` commands, and button-click handlers |
| 2025-06-20 | Huu Thien (git author `NguyenHuuThien098`) | Mezon connection and clan-ID fixes, `/health` endpoint, bot state service, `bot`, `active`, `deactivate`, `botstatus` and `ping` commands |
| 2025-06-20 | Lê Văn Trung Tính (`tms-tinhle`) | Command list added to this README |

Development then moved to `Devhelp-mezon`, which starts from a single import of this code and continues with further fixes, an argument parser and UI updates.

## What the code does at this snapshot

A NestJS application that logs in to Mezon with a bot token and answers prefixed chat commands (`*`, `/` or `\`):

| Command | Purpose |
| --- | --- |
| `*help` | Command overview |
| `*command save\|list\|detail\|find\|update\|delete\|restore` | Manage saved shell-command snippets (soft delete and restore) |
| `*bug create\|list\|detail\|update` | Log bugs with severity and status |
| `*solution create\|list\|detail\|update` | Solutions linked to a bug |
| `*search [commands\|bugs\|solutions] <keyword>` | Case-insensitive substring search |
| `*bot status\|on\|off\|reset`, `*active`, `*deactivate`, `*botstatus`, `*ping` | Bot on/off state and status |

Data is stored in PostgreSQL through TypeORM. See the `Devhelp-mezon` README for the full command reference, architecture and data model.

## Tech stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 18 |
| Framework | NestJS 10, `@nestjs/event-emitter`, `@nestjs/config` + Joi |
| Chat platform | `mezon-sdk` 2.7.99 |
| Persistence | PostgreSQL via TypeORM 0.3 |
| Package manager | Yarn 1 (`yarn.lock`) |

## Getting started

```bash
yarn install
yarn start:dev
```

A `.env` file in the project root must define the following (placeholders only):

| Name | Required | Description |
| --- | --- | --- |
| `POSTGRES_HOST` | yes | PostgreSQL host |
| `POSTGRES_PORT` | yes | PostgreSQL port |
| `POSTGRES_USER` | yes | Database user |
| `POSTGRES_PASSWORD` | yes | Database password |
| `POSTGRES_DB` | yes | Database name |
| `MEZON_TOKEN` | yes | Mezon bot token |
| `PORT` | no | HTTP port, defaults to `4000` |

## Notes

- Neither this repository nor the upstream template includes a license file; `package.json` marks the package as `UNLICENSED`.
- Constants and dependencies from the template that DevHelp does not use (for example `src/bot/constants/tables.ts`, `better-sqlite3`, `qrcode`) are still present.

## Author

Contributor: **Lê Văn Trung Tính** — Software Engineer | AI Product Builder

- Website: [trungtinh.site](https://trungtinh.site)
- GitHub: [@tinhne](https://github.com/tinhne)
