import Redis from "ioredis";
import { HealthTypes } from "@pokt-foundation/node-monitoring-core/dist/types";

export class Publish {
  private map: Map<any, any>;
  private threshold: number;
  private redis: any;
  constructor() {
    this.map = new Map();
    this.redis = new Redis();
    this.threshold = 2;
  }

  async evaluate({ message, id }) {
    if (message.status === HealthTypes.ErrorStatus.ERROR) {
      const exists = this.map.has(id);
      if (!exists) {
        this.map.set(id, 1);
      } else {
        this.map.set(id, Number(this.map.get(id) + 1));
      }
      const count = this.map.get(id);
      if (count >= this.threshold) {
        await this.redis.publish("send-error-event", JSON.stringify({ ...message, id: id, count }));
      }
    }
    if (message.status === HealthTypes.ErrorStatus.OK) {
      if (this.map.has(id)) {
        this.map.delete(id);
        await this.redis.publish("send-resolved-event", JSON.stringify({ ...message, id: id }));
      }
    }
  }
}