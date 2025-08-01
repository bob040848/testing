import { sayHello, addTask, updateTask  } from "@/graphql/resolvers/mutations";
import { helloQuery,getAllActiveTasks, getFinishedTasksLists} from "@/graphql/resolvers/queries";

export const resolvers = {
  Query: {
    helloQuery,
    getAllActiveTasks,
    getFinishedTasksLists,
  },
  Mutation: {
    sayHello,
    addTask,
    updateTask,    
  },
};
