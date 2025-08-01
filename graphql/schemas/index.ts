import { gql } from "graphql-tag";

export const typeDefs = gql`
type Task {
    _id: ID!,
    taskName: String!,
    description: String!,
    isDone: Boolean!,
    priority: Int!,
    tags: [String!]!,
    userId: ID!,
    createdAt: String,
    updatedAt: String,
}

input AddTaskInput {
    taskName: String!,
    description: String!,
    priority: Int!,
    tags: [String!],
    userId: ID!,
}

input UpdateTaskInput {
    taskId: ID!,
    taskName: String,
    description: String,
    priority: Int,
    tags: [String!],
    isDone: Boolean,  
    userId: String!
}

type Query {
    helloQuery: String!
    getAllActiveTasks(userId: String!): [Task!]!
    getFinishedTasksLists(userId: String!): [Task!]!
}

type Mutation {
    sayHello(name: String!): String!
    addTask(input: AddTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
}
`