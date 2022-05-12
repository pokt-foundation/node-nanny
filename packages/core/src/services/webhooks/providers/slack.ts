// import { WebClient } from '@slack/web-api'

import { INode, WebhookModel } from '../../../models';

// import env from '../../../environment';

// For a future feature request:
// Docs for WebApi are at: https://slack.dev/node-slack-sdk/web-api
// WebApi Methods: https://api.slack.com/methods

/* Pseudocode outline implementation */
export class Service {
  // private client: WebClient;
  // constructor() {
  //   this.client = new WebClient(env('SLACK_TOKEN'));
  // }

  // private async initServer(): Promise<any> {
  //   return new App({
  //     token: this.token,
  //     signingSecret: process.env.SLACK_SIGNING_SECRET,
  //   });
  // }

  public async addWebhookForNode({ chain, host }: INode): Promise<void> {
    //   try {
    //     const { name } = chain;
    //     const {
    //       location: { name: location },
    //     } = host;
    //     const noSlackVar = !env('SLACK_TOKEN');
    //     if (noSlackVar) {
    //       return;
    //     }
    //     const { channels } = await this.client.conversations.list();
    //     const channelName = `${name}-${location}`.toLowerCase();
    //     if (!channels.includes(channelName)) {
    //       await this.client.conversations.create({
    //         name: channelName,
    //       });
    //       await WebhookModel.create({ chain: name, location, url: channelName });
    //     }
    //   } catch (error) {
    //     throw new Error(`Slack channel creation error: ${error.message}`);
    //   }
  }

  public async addWebhookForFrontendNodes(): Promise<void> {
    //   const channelName = 'frontend-alert';
    //   const { channels } = await this.client.conversations.list();
    //   if (!channels.includes(channelName)) {
    //     await this.client.conversations.create({
    //       name: channelName,
    //     });
    //     if (!(await WebhookModel.exists({ chain: 'FRONTEND_ALERT' }))) {
    //       await WebhookModel.create({
    //         chain: 'FRONTEND_ALERT',
    //         location: 'n/a',
    //         url: channelName,
    //       });
    //     }
    //   }
  }
}
