import { Task } from "@/mongoose/index"; 
import { GraphQLError } from "graphql";

type UpdateTaskInput ={
    taskId: string;
    taskName?: string;
    description?: string;
    priority?: number;
    tags?: string[];
    isDone?: boolean;
    userId: string; 
  }

export const updateTask =  async (_: unknown, { input }: { input: UpdateTaskInput }) => {
    try {
      const { taskId, userId, ...updateFields } = input;

      if (!taskId || !userId) {
        throw new GraphQLError("taskId and userId are required");
      }

      const existingTask = await Task.findById(taskId);

      if (!existingTask) {
        throw new GraphQLError("Task not found");
      }

      if (existingTask.userId !== userId) {
        throw new GraphQLError("Unauthorized: You can only update your own tasks");
      }

      if (updateFields.description !== undefined) {
        if (updateFields.description.length < 10) {
          throw new GraphQLError("Description must be at least 10 characters long");
        }
        
        const taskNameToCheck = updateFields.taskName ?? existingTask.taskName;
        if (updateFields.description === taskNameToCheck) {
          throw new GraphQLError("Description cannot be the same as taskName");
        }
      }

      if (updateFields.priority !== undefined) {
        if (updateFields.priority < 1 || updateFields.priority > 5) {
          throw new GraphQLError("Priority must be between 1 and 5");
        }
      }

      if (updateFields.tags !== undefined && updateFields.tags.length > 5) {
        throw new GraphQLError("Tags cannot exceed 5 items");
      }

      if (updateFields.taskName && updateFields.taskName !== existingTask.taskName) {
        const duplicateTask = await Task.findOne({
          taskName: updateFields.taskName,
          userId,
          _id: { $ne: taskId } 
        });

        if (duplicateTask) {
          throw new GraphQLError("Task with this name already exists for this user");
        }
      }

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateFields },
        { 
          new: true, 
          runValidators: true
        }
      );

      return updatedTask;

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
        const messages = Object.values((error as any).errors).map(
          (err: any) => err.message
        );
        throw new GraphQLError(`Validation Error: ${messages.join(", ")}`);
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
        "Failed to update task: " +
          (typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error))
      );
    }
  }