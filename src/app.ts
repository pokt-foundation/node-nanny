import { Alert, Discover, Health, Log } from "./services";
import { DiscoverTypes, HealthTypes, AlertTypes } from "./types";
import { wait } from "./utils";
export class App {
  private alert: Alert;
  private discover: Discover;
  private health: Health;
  private log: Log;
  constructor() {
    this.alert = new Alert();
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.log = new Log();
    this.health = new Health();
  }

  async main() {
    let { dataNodes, pocketNodes } = await this.discover.getNodes();

    console.log("checking pocket nodes");

    const pocketHealth = await this.health.getPocketHealth(pocketNodes);

    console.log("checking data nodes")
    const response = [];
    for (const { node, peer, external } of dataNodes) {
      const { name } = node;

      await wait(3000);

      const health = await this.health.getNodeHealth({ node, peer, external });

      console.info({ name, health });

      let message = JSON.stringify(health);
      response.push({ name, message });

      await this.log.write({ message, name });

      if (health.status === HealthTypes.ErrorStatus.ERROR) {
        if (health.conditions === HealthTypes.ErrorConditions.OFFLINE) {
          await this.alert.sendAlert({
            channel: AlertTypes.AlertChannel.BOTH,
            title: AlertTypes.Titles.OFFLINE,
            details: `Node ${name} is currently offline`,
          });
        }

        if (health.conditions === HealthTypes.ErrorConditions.PEER_OFFLINE) {
          await this.alert.sendAlert({
            channel: AlertTypes.AlertChannel.DISCORD,
            title: AlertTypes.Titles.OFFLINE,
            details: `Node ${name}'s peer ${peer.name} is currently offline`,
          });
        }

        if (health.conditions === HealthTypes.ErrorConditions.NOT_SYNCHRONIZED) {
          await this.alert.sendAlert({
            channel: AlertTypes.AlertChannel.DISCORD,
            title: AlertTypes.Titles.NOT_SYNCHRONIZED,
            details: `Node ${name} is currently not in synch ${message}}`,
          });
        }
      }
    }
    return response;
  }
}
