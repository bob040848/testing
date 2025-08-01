import { gql } from "graphql-tag";

export const typeDefs = gql`
  type Query {
    helloQuery: String
  }

  type Mutation {
    sayHello(name: String!): String
  }
`;
