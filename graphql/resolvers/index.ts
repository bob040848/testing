import { sayHello } from "./mutations/say-hello";
import { helloQuery } from "./queries/hello-query";

export const resolvers = {
  Query: {
    helloQuery,
  },
  Mutation: {
    sayHello,
  },
};
