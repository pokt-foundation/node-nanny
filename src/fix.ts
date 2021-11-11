import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog, Log, Event } from "./services";
const dd = new DataDog();
const retool = new Retool();
const log = new Log();
const event = new Event();
const fix = async () => {
  await connect();
  await event.processEvent(pocket);
  return "done";
};

fix().then(console.log);

const pocket = {
  msg:
    "%%%\n" +
    "@webhook-events-production\n" +
    "nodeId_61803621138aed0010560f1c\n" +
    "event_NO_RESPONSE\n" +
    "\n" +
    'More than **1** log events matched in the last **5m** against the monitored query: **[status:error source:"/pocket/nodemonitoring/dispatch-11.nodes.pokt.network"](https://app.datadoghq.eu/logs/analytics?query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-11.nodes.pokt.network%22&agg_m=count&agg_t=count&agg_q=%40conditions&index=)** by **@conditions**\n' +
    "\n" +
    "The monitor was last triggered at Thu Nov 11 2021 18:19:35 UTC.\n" +
    "\n" +
    "- - -\n" +
    "\n" +
    "[[Monitor Status](https://app.datadoghq.eu/monitors/2969135?to_ts=1636654775000&group=%40conditions%3ANO_RESPONSE&from_ts=1636653875000)] · [[Edit Monitor](https://app.datadoghq.eu/monitors#2969135/edit)] · [[Related Logs](https://app.datadoghq.eu/logs/analytics?index=%2A&to_ts=1636654775000&agg_t=count&agg_m=count&agg_q=%40conditions&from_ts=1636653875000&live=false&query=status%3Aerror+source%3A%22%2Fpocket%2Fnodemonitoring%2Fdispatch-11.nodes.pokt.network%22)]",
  id: "2969135",
  transition: "Recovered",
  type: "error",
  title: "[Triggered on {@conditions:NO_RESPONSE}] DISPATCH-11.NODES.POKT.NETWORK",
  status: "",
  link: "https://app.datadoghq.eu/event/event?id=6247701040331660297",
};