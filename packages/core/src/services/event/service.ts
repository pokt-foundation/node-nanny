import { EErrorConditions, EErrorStatus, ESupportedBlockchains } from "../health/types";
import { INode, NodesModel } from "../../models";
import { s } from "../../utils";
import { AlertTypes } from "../../types";
import {
  EAlertTypes,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";

import { Service as BaseService } from "../base-service/base-service";

export class Service extends BaseService {
  private pnf: boolean;
  private pnfDispatchThreshold: number;

  constructor() {
    super();
    this.pnf = Boolean(process.env.PNF === "1");
    this.pnfDispatchThreshold = Number(process.env.PNF_DISPATCH_THRESHOLD || 5);
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    const { node, message, notSynced, status, conditions, title } = await this.parseEvent(
      eventJson,
      EAlertTypes.TRIGGER,
    );
    const { chain, frontend } = node;
    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const { node, message, notSynced, status, conditions, title } = await this.parseEvent(
      eventJson,
      EAlertTypes.RETRIGGER,
    );
    const { chain, frontend } = node;
    const messageParams = {
      title,
      message,
      chain: chain.name,
      frontend: Boolean(frontend),
    };

    if (!frontend && notSynced) {
      const { backend, loadBalancers } = node;
      const count = await this.getServerCount({ backend, loadBalancers });
      await this.sendMessage(
        messageParams,
        count >= 2 ? EErrorStatus.WARNING : EErrorStatus.ERROR,
      );

      if (count >= 2) await this.toggleServer({ node, title, enable: false });
    } else {
      await this.sendMessage(messageParams, status);
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      status,
      conditions,
      title,
      warningMessage,
    } = await this.parseEvent(eventJson, EAlertTypes.RESOLVED);
    const { chain, frontend } = node;

    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );
    if (warningMessage) {
      await this.sendMessage(
        {
          title,
          message: warningMessage,
          chain: chain.name,
          frontend: Boolean(frontend),
        },
        EErrorStatus.WARNING,
      );
    }

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: true });
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  /* ----- Private Methods ----- */
  private async parseEvent(
    eventJson: string,
    alertType: EAlertTypes,
  ): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, name, status, sendWarning } = event;

    const parsedEvent: IRedisEventParams = {
      title: `${name} is ${conditions}`,
      message: this.getAlertMessage(event, alertType),
      node: await this.getNode(id),
      notSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
      status,
      conditions,
    };
    if (sendWarning) parsedEvent.warningMessage = this.getWarningMessage(event);
    return parsedEvent;
  }

  private async sendMessage(
    params: AlertTypes.IAlertParams,
    status: EErrorStatus,
  ): Promise<void> {
    await {
      [EErrorStatus.OK]: () => this.alert.sendSuccess(params),
      [EErrorStatus.WARNING]: () => this.alert.sendWarn(params),
      [EErrorStatus.ERROR]: () => this.alert.sendError(params),
    }[status]();
  }

  private async toggleServer({
    node,
    title,
    enable,
  }: IToggleServerParams): Promise<void> {
    const {
      backend,
      chain: { name: chain },
      loadBalancers,
      server,
    } = node;

    const message = this.getRotationMessage(node, enable, "attempt");
    await this.alert.sendInfo({ title, message, chain });

    try {
      enable /* Enable or Disable Server */
        ? await this.enableServer({ backend, server, loadBalancers })
        : await this.disableServer({ backend, server, loadBalancers });

      const message = this.getRotationMessage(node, enable, "success");
      await this.alert.sendSuccess({ title, message, chain });
    } catch (error) {
      const message = this.getRotationMessage(node, enable, "error", error);
      await this.alert.sendError({ title, message, chain });
    }
  }

  private async alertPocketDispatchersAreDown(node: INode): Promise<void> {
    const downDispatchers = await this.checkPocketDispatchPeers(node);
    const dispatchUrls = downDispatchers.map(({ url }) => `${url}\n`);

    if (downDispatchers?.length >= this.pnfDispatchThreshold) {
      await this.alert.createPagerDutyIncident({
        title: "ALERT - Dispatchers are down!",
        details: [
          `${downDispatchers.length} dispatchers are down!`,
          `Down Dispatchers: ${dispatchUrls}`,
        ].join("\n"),
      });
    }
  }

  private async checkPocketDispatchPeers({ chain }: INode): Promise<INode[]> {
    return NodesModel.find({
      dispatch: true,
      chain: chain.id,
      status: { $ne: EErrorStatus.OK },
      conditions: { $ne: EErrorConditions.HEALTHY },
    });
  }

  /* ----- Message String Methods ----- */
  private getAlertMessage(
    { count, conditions, name, ethSyncing, height }: IRedisEvent,
    alertType: EAlertTypes,
  ): string {
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height ? `Height: ${JSON.stringify(height)}` : "";

    const alertTypeString = {
      [EAlertTypes.TRIGGER]: "First Alert",
      [EAlertTypes.RETRIGGER]: "Continuous Alert",
      [EAlertTypes.RESOLVED]: "Event Resolved",
    }[alertType];

    return [
      alertTypeString,
      `${name} is ${conditions}.`,
      `This event has occurred ${count} time${s(count)} since first occurrence.`,
      ethSyncStr,
      heightStr,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private getWarningMessage({ conditions, name, details }: IRedisEvent): string {
    const badOracles = details?.badOracles;
    const bOracleStr = badOracles
      ? `Bad Oracle${s(badOracles.length)}: ${badOracles}`
      : "";

    return [`WARNING: ${name} is ${conditions}.`, bOracleStr].filter(Boolean).join("\n");
  }

  private getRotationMessage(
    { backend, chain, host, loadBalancers }: INode,
    enable: boolean,
    mode: "attempt" | "success" | "error",
    error?: any,
  ): string {
    const name = `${host.name}/${chain.name}`;
    const haProxyMessage = this.getHAProxyMessage({ backend, loadBalancers });
    const errorMessage = `\n${error}`;
    return enable
      ? {
          attempt: `Attempting to add ${name} to rotation.\n${haProxyMessage}`,
          success: `Successfully added ${name} to rotation.\n${haProxyMessage}`,
          error: `Could not add ${name} to rotation.\n${haProxyMessage}${errorMessage}`,
        }[mode]
      : {
          attempt: `Attempting to remove ${name} from rotation.\n${haProxyMessage}`,
          success: `Successfully removed ${name} from rotation.\n${haProxyMessage}`,
          error: `Could not remove ${name} from rotation.\n${haProxyMessage}${errorMessage}`,
        }[mode];
  }
}
