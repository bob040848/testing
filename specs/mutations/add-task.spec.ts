import { addTask } from "@/graphql/resolvers/mutations/add-task";
import { Task } from "@/mongoose/index";
import { GraphQLError } from "graphql";

jest.mock("@/mongoose/index", () => ({
  Task: {
    findOne: jest.fn(),
    prototype: {
      save: jest.fn(),
    },
  },
}));

const MockedTask = Task as jest.Mocked<typeof Task>;
const mockTaskInstance = {
  save: jest.fn(),
};

describe("Add Task Mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the Task constructor
    (Task as any).mockImplementation(() => mockTaskInstance);
  });

  it("should successfully create a new task with valid input", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a test task description that is long enough",
      priority: 3,
      tags: ["work", "urgent"],
      userId: "user123",
    };

    const mockSavedTask = {
      _id: "task123",
      ...input,
      isDone: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    MockedTask.findOne.mockResolvedValue(null);
    mockTaskInstance.save.mockResolvedValue(mockSavedTask);

    const result = await addTask({}, { input });

    expect(MockedTask.findOne).toHaveBeenCalledWith({
      taskName: input.taskName,
      userId: input.userId,
    });
    expect(mockTaskInstance.save).toHaveBeenCalled();
    expect(result).toEqual(mockSavedTask);
  });

  it("should throw error when required fields are missing", async () => {
    const input = {
      taskName: "",
      description: "Valid description that is long enough",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "taskName, description, and userId are required fields"
    );
  });

  it("should throw error when description is too short", async () => {
    const input = {
      taskName: "Test Task",
      description: "Short",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Description must be at least 10 characters long"
    );
  });

  it("should throw error when description equals taskName", async () => {
    const input = {
      taskName: "Test Task Name",
      description: "Test Task Name",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Description cannot be the same as taskName"
    );
  });

  it("should throw error when priority is out of range", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a valid description that is long enough",
      priority: 6,
      tags: [],
      userId: "user123",
    };

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Priority must be between 1 and 5"
    );
  });

  it("should throw error when tags exceed 5 items", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a valid description that is long enough",
      priority: 3,
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
      userId: "user123",
    };

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Tags cannot exceed 5 items"
    );
  });

  it("should throw error when task with same name exists for user", async () => {
    const input = {
      taskName: "Existing Task",
      description: "This is a valid description that is long enough",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    const existingTask = {
      _id: "existing123",
      taskName: input.taskName,
      userId: input.userId,
    };

    MockedTask.findOne.mockResolvedValue(existingTask);

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle database validation errors", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a valid description that is long enough",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    MockedTask.findOne.mockResolvedValue(null);
    
    const validationError = {
      name: "ValidationError",
      errors: {
        field1: { message: "Field1 error" },
        field2: { message: "Field2 error" },
      },
    };

    mockTaskInstance.save.mockRejectedValue(validationError);

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Validation Error: Field1 error, Field2 error"
    );
  });

  it("should handle duplicate key errors", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a valid description that is long enough",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    MockedTask.findOne.mockResolvedValue(null);
    
    const duplicateError = {
      code: 11000,
    };

    mockTaskInstance.save.mockRejectedValue(duplicateError);

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle unknown errors", async () => {
    const input = {
      taskName: "Test Task",
      description: "This is a valid description that is long enough",
      priority: 3,
      tags: [],
      userId: "user123",
    };

    MockedTask.findOne.mockResolvedValue(null);
    mockTaskInstance.save.mockRejectedValue(new Error("Unknown database error"));

    await expect(addTask({}, { input })).rejects.toThrow(GraphQLError);
    await expect(addTask({}, { input })).rejects.toThrow(
      "Failed to create task: Unknown database error"
    );
  });
});