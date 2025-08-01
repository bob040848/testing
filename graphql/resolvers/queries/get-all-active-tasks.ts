import { Task } from "@/mongoose/index";
import { GraphQLError } from "graphql";

type QueryArguments ={
  userId: string;
}

export const getAllActiveTasks = async (_: unknown, { userId }: QueryArguments) => {
    try {
      if (!userId) {
        throw new GraphQLError("userId is needed");
      }

      const userExists = await Task.findOne({ userId });
      
      if (!userExists) {
        throw new GraphQLError("User not found");
      }

      const activeTasks = await Task.find({
        userId,
        isDone: false
      }).sort({ priority: -1, createdAt: -1 }); 

      return activeTasks;

    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new GraphQLError("Failed to retrieve active tasks: " + error.message);
      }
      throw new GraphQLError("Failed to retrieve active tasks: Unknown error");
    }
  }