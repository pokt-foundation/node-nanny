import { Service as DiscordService } from './providers/discord';
import { Service as SlackService } from './providers/slack';

import env from '../../environment';

export const Service = {
  discord: DiscordService,
  slack: SlackService,
}[env('ALERT_PROVIDER')];
