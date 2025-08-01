import { updateTask } from "@/graphql/resolvers/mutations/update-task";
import { Task } from "@/mongoose/index";
import { GraphQLError } from "graphql";

jest.mock("@/mongoose/index", () => ({
  Task: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

const MockedTask = Task as jest.Mocked<typeof Task>;

describe("Update Task Mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockExistingTask = {
    _id: "task123",
    taskName: "Original Task",
    description: "Original description that is long enough",
    priority: 2,
    tags: ["work"],
    userId: "user123",
    isDone: false,
  };

  it("should successfully update a task with valid input", async () => {
    const input = {
      taskId: "task123",
      taskName: "Updated Task",
      description: "Updated description that is long enough",
      priority: 4,
      userId: "user123",
    };

    const mockUpdatedTask = {
      ...mockExistingTask,
      ...input,
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findOne.mockResolvedValue(null);
    MockedTask.findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

    const result = await updateTask({}, { input });

    expect(MockedTask.findById).toHaveBeenCalledWith(input.taskId);
    expect(MockedTask.findByIdAndUpdate).toHaveBeenCalledWith(
      input.taskId,
      { $set: { taskName: input.taskName, description: input.description, priority: input.priority } },
      { new: true, runValidators: true }
    );
    expect(result).toEqual(mockUpdatedTask);
  });

  it("should throw error when taskId or userId is missing", async () => {
    const input = {
      taskId: "",
      userId: "user123",
    };

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "taskId and userId are required"
    );
  });

  it("should throw error when task is not found", async () => {
    const input = {
      taskId: "nonexistent123",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(null);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow("Task not found");
  });

  it("should throw error when user is not the task owner", async () => {
    const input = {
      taskId: "task123",
      userId: "differentUser456",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Unauthorized: You can only update your own tasks"
    );
  });

  it("should throw error when description is too short", async () => {
    const input = {
      taskId: "task123",
      description: "Short",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Description must be at least 10 characters long"
    );
  });

  it("should throw error when description equals taskName", async () => {
    const input = {
      taskId: "task123",
      taskName: "Same Name",
      description: "Same Name",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Description cannot be the same as taskName"
    );
  });

  it("should throw error when description equals existing taskName", async () => {
    const input = {
      taskId: "task123",
      description: "Original Task",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Description cannot be the same as taskName"
    );
  });

  it("should throw error when priority is out of range", async () => {
    const input = {
      taskId: "task123",
      priority: 6,
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Priority must be between 1 and 5"
    );
  });

  it("should throw error when tags exceed 5 items", async () => {
    const input = {
      taskId: "task123",
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Tags cannot exceed 5 items"
    );
  });

  it("should throw error when updating to duplicate taskName", async () => {
    const input = {
      taskId: "task123",
      taskName: "Duplicate Task Name",
      userId: "user123",
    };

    const duplicateTask = {
      _id: "different456",
      taskName: "Duplicate Task Name",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findOne.mockResolvedValue(duplicateTask);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should allow updating to same taskName (no change)", async () => {
    const input = {
      taskId: "task123",
      taskName: "Original Task",
      description: "New description that is long enough",
      userId: "user123",
    };

    const mockUpdatedTask = {
      ...mockExistingTask,
      description: input.description,
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

    const result = await updateTask({}, { input });

    expect(MockedTask.findOne).not.toHaveBeenCalled();
    expect(result).toEqual(mockUpdatedTask);
  });

  it("should update isDone status", async () => {
    const input = {
      taskId: "task123",
      isDone: true,
      userId: "user123",
    };

    const mockUpdatedTask = {
      ...mockExistingTask,
      isDone: true,
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findByIdAndUpdate.mockResolvedValue(mockUpdatedTask);

    const result = await updateTask({}, { input });

    expect(result).toEqual(mockUpdatedTask);
    expect(MockedTask.findByIdAndUpdate).toHaveBeenCalledWith(
      input.taskId,
      { $set: { isDone: input.isDone } },
      { new: true, runValidators: true }
    );
  });

  it("should handle validation errors", async () => {
    const input = {
      taskId: "task123",
      taskName: "Updated Task",
      userId: "user123",
    };

    const validationError = {
      name: "ValidationError",
      errors: {
        field1: { message: "Field1 error" },
        field2: { message: "Field2 error" },
      },
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findByIdAndUpdate.mockRejectedValue(validationError);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Validation Error: Field1 error, Field2 error"
    );
  });

  it("should handle duplicate key errors", async () => {
    const input = {
      taskId: "task123",
      taskName: "Updated Task",
      userId: "user123",
    };

    const duplicateError = {
      code: 11000,
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findByIdAndUpdate.mockRejectedValue(duplicateError);

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle unknown errors", async () => {
    const input = {
      taskId: "task123",
      taskName: "Updated Task",
      userId: "user123",
    };

    MockedTask.findById.mockResolvedValue(mockExistingTask);
    MockedTask.findByIdAndUpdate.mockRejectedValue(new Error("Unknown database error"));

    await expect(updateTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(updateTask({}, { input })).rejects.toThrow(
      "Failed to update task: Unknown database error"
    );
  });
});