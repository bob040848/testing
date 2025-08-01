import { Task } from "@/mongoose/index";  
import { GraphQLError } from "graphql";

type QueryArguments ={
  userId: string;
}

export const getFinishedTasksLists = async (_: unknown, { userId }: QueryArguments) => {
    try {
      if (!userId) {
        throw new GraphQLError("userId is required");
      }

      const userExists = await Task.findOne({ userId });
      
      if (!userExists) {
        throw new GraphQLError("User not found");
      }

      const completedTasks = await Task.find({
        userId,
        isDone: true
      }).sort({ updatedAt: -1 });

      return completedTasks;

    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GraphQLError("Failed to retrieve completed tasks: " + error.message);
      }
      throw new GraphQLError("Failed to retrieve completed tasks: Unknown error");
    }
  }

