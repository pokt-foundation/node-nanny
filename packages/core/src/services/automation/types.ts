import { Types } from 'mongoose';
import {
  ChainsModel,
  HostsModel,
  LocationsModel,
  NodesModel,
  OraclesModel,
} from '../../models';

export interface IAutomationServiceModels {
  chainsModel: typeof ChainsModel;
  hostsModel: typeof HostsModel;
  locationsModel: typeof LocationsModel;
  nodesModel: typeof NodesModel;
  oraclesModel: typeof OraclesModel;
}

export interface INodeCreationProps {
  nodeInput: INodeInput;
  restart?: boolean;
  createWebhook?: boolean;
}

export interface INodeInput {
  https: boolean;
  chain: Types.ObjectId;
  host: Types.ObjectId;
  name: string;
  url: string;
  port: number;
  automation: boolean;
  loadBalancers?: Types.ObjectId[];
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
  dispatch?: boolean;
}

export interface INodeCsvInput {
  https: string;
  chain: string;
  host: string;
  name: string;
  loadBalancers: string[];
  port: string;
  automation: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
  basicAuth?: string;
}

export interface IHostInput {
  name: string;
  location: Types.ObjectId;
  loadBalancer: boolean;
  ip?: string;
  fqdn?: string;
}

export interface IHostCsvInput {
  name: string;
  location: string;
  loadBalancer?: string;
  ip?: string;
  fqdn?: string;
}

export interface IChainInput {
  id: string;
  name: string;
  type: string;
  chainId: string;
  allowance: number;
}

export interface INodeUpdate {
  id: string;
  https?: boolean;
  chain?: string;
  host?: string;
  name?: string;
  url?: string;
  loadBalancers?: string[];
  port?: string;
  automation?: boolean;
  backend?: string;
  frontend?: string;
  server?: string;
}

export interface IHostUpdate {
  id: string;
  name?: string;
  location?: string;
  loadBalancer?: boolean;
  ip?: string;
  fqdn?: string;
}

export interface IChainUpdate {
  id: string;
  name?: string;
  type?: string;
  chainId?: string;
  allowance?: number;
}

export interface IOracleUpdate {
  chain: string;
  urls: string[];
}
