import { sayHello, addTask, updateTask  } from "@/graphql/resolvers/mutations";
import { helloQuery,getAllActiveTasks, getFinishedTasksLists, getUserDoneTasksLists  } from "@/graphql/resolvers/queries";

export const resolvers = {
  Query: {
    helloQuery,
    getAllActiveTasks,
    getFinishedTasksLists,
    getUserDoneTasksLists
  },
  Mutation: {
    sayHello,
    addTask,
    updateTask,    
  },
};
