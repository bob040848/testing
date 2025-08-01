import { Task } from "@/mongoose/index"; 
import { GraphQLError } from "graphql";

type AddTaskInput ={
  taskName: string;
  description: string;
  priority: number;
  tags: string[];
  userId: string;
}

export const addTask = async (_: unknown, { input }: { input: AddTaskInput }) => {
    try {
      const { taskName, description, priority, tags, userId } = input;

      if (!taskName || !description || !userId) {
        throw new GraphQLError("taskName, description, and userId are required fields");
      }

      if (description.length < 10) {
        throw new GraphQLError("Description must be at least 10 characters long");
      }

      if (description === taskName) {
        throw new GraphQLError("Description cannot be the same as taskName");
      }

      if (priority < 1 || priority > 5) {
        throw new GraphQLError("Priority must be between 1 and 5");
      }

      if (tags && tags.length > 5) {
        throw new GraphQLError("Tags cannot exceed 5 items");
      }

      const existingTask = await Task.findOne({
        taskName,
        userId
      });

      if (existingTask) {
        throw new GraphQLError("Task with this name already exists for this user");
      }

      const newTask = new Task({
        taskName,
        description,
        priority,
        tags: tags || [],
        userId,
        isDone: false 
      });

      const savedTask = await newTask.save();
      return savedTask;

    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ValidationError" &&
        "errors" in error &&
        typeof (error as any).errors === "object"
      ) {
        const messages = Object.values((error as any).errors).map((err: any) => err.message);
        throw new GraphQLError(`Validation Error: ${messages.join(', ')}`);
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as any).code === 11000
      ) {
        throw new GraphQLError("Task with this name already exists for this user");
      }

      throw new GraphQLError(
        "Failed to create task: " +
          (typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error))
      );
    }
  }