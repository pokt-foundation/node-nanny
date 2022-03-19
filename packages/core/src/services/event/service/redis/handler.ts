import BaseService from "./base-service";
import { INode } from "../../../../models";
import { s } from "../../../../utils";
import { IRedisEvent, IRedisEventParams, IToggleServerParams } from "./types";
import { EErrorConditions, EErrorStatus } from "../../../health/types";
import { AlertTypes } from "../../../../types";

export class Service extends BaseService {
  constructor() {
    super();
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    const { title, message, node, notSynced, status } = await this.parseEvent(eventJson);
    await this.sendMessage({ title, message, chain: node.chain.name }, status);

    if (notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const { title, message, node, status } = await this.parseEvent(eventJson);

    await this.sendMessage({ title, message, chain: node.chain.name }, status);
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const {
      title,
      message,
      node,
      notSynced,
      status,
      warningMessage,
    } = await this.parseEvent(eventJson);

    await this.sendMessage({ title, message, chain: node.chain.name }, status);
    if (warningMessage) {
      await this.sendMessage(
        { title, message: warningMessage, chain: node.chain.name },
        EErrorStatus.WARNING,
      );
    }

    if (notSynced) {
      await this.toggleServer({ node, title, enable: true });
    }
  };

  /* ----- Private Methods ----- */
  private async parseEvent(eventJson: string): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, name, status, sendWarning } = event;

    const parsedEvent = {
      title: `${name} is ${conditions}`,
      message: this.getAlertMessage(event),
      node: await this.getNode(id),
      notSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
      status,
      warningMessage: sendWarning ? this.getWarningMessage(event) : null,
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

  /* ----- Message String Methods ----- */
  private getAlertMessage({
    count,
    conditions,
    name,
    ethSyncing,
    height,
  }: IRedisEvent): string {
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height ? `Height: ${JSON.stringify(height)}` : "";

    return [
      `${name} is ${conditions}.`,
      `This event has occurred ${count} time${s(count)} since first occurrence.`,
      ethSyncStr,
      heightStr,
    ]
      .filter(Boolean)
      .join("\n");
  }

  private getWarningMessage({ conditions, name, details }: IRedisEvent): string {
    const bOracle = details?.badOracles;
    const bOracleStr = bOracle ? `Bad Oracle${s(bOracle.length)}: ${bOracle}` : "";

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