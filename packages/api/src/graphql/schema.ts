import { gql } from "apollo-server";

const typeDefs = gql`
  # Types
  type Chain {
    id: ID!
    name: String!
    type: String!
  }

  type Host {
    id: ID!
    name: String!
    ip: String
    loadBalancer: Boolean
    location: String
  }

  type Log {
    id: ID!
    timestamp: String
    level: String
    message: String
    label: ID
  }

  type Node {
    id: ID!
    backend: String
    chain: Chain
    haProxy: Boolean
    host: Host
    port: Int
    server: String
    url: String
    variance: Int
    ssl: Boolean
    basicAuth: String
    loadBalancers: [ID]
  }

  type Oracle {
    id: ID!
    chain: String!
    urls: [String]
  }

  type Webhook {
    id: ID!
    location: String
    chain: String
    url: String
  }

  # Inputs
  input NodeInput {
    backend: String
    chain: ID
    haProxy: Boolean
    host: ID
    port: Int
    server: String
    url: String
    variance: Int
    ssl: Boolean
    basicAuth: String
    loadBalancers: [ID]
  }

  # Resolvers
  type Query {
    chains: [Chain]
    hosts(loadBalancer: Boolean): [Host]
    logs(id: String): [Log]
    nodes: [Node]
    oracles: [Oracle]
    webhooks: [Webhook]

    haProxyStatus(id: String): String
    nodeStatus(id: String): String
  }

  type Mutation {
    createChain(name: String, type: String): Chain
    createHost(name: String, ip: String, loadBalancer: Boolean, location: String): Host
    createNode(input: NodeInput): Node
    createOracle(chain: String, url: String): Oracle
    createWebhook(location: String, chain: String, url: String): Webhook

    updateNode(input: NodeInput): Node
    updatehost(name: String, ip: String): Host
    updateOracle(id: ID, action: String, url: String): Oracle
    updateChain(name: String, type: String): Chain
    updateNodeInRotation(id: ID, action: String): String

    deleteNode(id: ID): Node
    deletehost(id: ID): Host
    deleteOracle(id: ID): Oracle
    deleteChain(id: ID): Chain
  }
`;

export default typeDefs;