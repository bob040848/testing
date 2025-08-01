import { Task } from "@/mongoose/index";  
import { GraphQLError } from "graphql";

type QueryArguments = {
  userId: string;
}

export const getUserDoneTasksLists = async (_: unknown, { userId }: QueryArguments) => {
  try {
    if (!userId) {
      throw new GraphQLError("userId is needed");
    }

    const userExists = await Task.findOne({ userId });
    
    if (!userExists) {
      throw new GraphQLError("User not found");
    }

    const doneTasks = await Task.find({
      userId,
      isDone: true
    }).sort({ updatedAt: -1 });

    return doneTasks;

  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new GraphQLError("Failed to retrieve done tasks: " + error.message);
    }
    throw new GraphQLError("Failed to retrieve done tasks: Unknown error");
  }
}