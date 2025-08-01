import { addTask } from "@graphql/resolvers/mutations/add-task";
import { Task as TaskOriginal } from "../../models/index";

jest.mock("@/", () => {
  const saveMock = jest.fn();

  const TaskMock = jest.fn().mockImplementation(() => ({
    save: saveMock,
  }));

  (TaskMock as any).findOne = jest.fn();

  return {
    Task: TaskMock,
  };
});

const Task = require("../../models/index").Task as jest.Mocked<typeof TaskOriginal>;

describe("addTask mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new task successfully", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockResolvedValue({
      _id: "1",
      taskName: "test task",
      description: "This is a valid task description",
      priority: 3,
      tags: ["work"],
      userId: "1",
      isDone: false,
    });

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "test task",
        description: "This is a valid task description",
        priority: 3,
        tags: ["work"],
        userId: "1",
      },
    };

    const result = await addTask({}, input);

    expect(result).toEqual({
      _id: "1",
      taskName: "test task",
      description: "This is a valid task description",
      priority: 3,
      tags: ["work"],
      userId: "1",
      isDone: false,
    });

    expect(Task.findOne).toHaveBeenCalledWith({
      taskName: input.input.taskName,
      userId: input.input.userId,
    });
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("should create a task with empty tags array when tags is undefined", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockResolvedValue({
      _id: "2",
      taskName: "task without tags",
      description: "This task has no tags",
      priority: 1,
      tags: [],
      userId: "1",
      isDone: false,
    });

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "task without tags",
        description: "This task has no tags",
        priority: 1,
        userId: "1",
      },
    };
    

    const result = await addTask({}, input as any);

    expect(result.tags).toEqual([]);
  });

  it("should throw error if required fields are missing - taskName", async () => {
    const input = {
      input: {
        taskName: "",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "taskName, description, and userId are required fields"
    );
  });

  it("should throw error if required fields are missing - userId", async () => {
    const input = {
      input: {
        taskName: "Valid task name",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "taskName, description, and userId are required fields"
    );
  });

  it("should throw error if description is less than 10 characters", async () => {
    const input = {
      input: {
        taskName: "Task 1",
        description: "Too short",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Description must be at least 10 characters long"
    );
  });

  it("should throw error if description equals taskName", async () => {
    const input = {
      input: {
        taskName: "Same text value",
        description: "Same text value",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Description cannot be the same as taskName"
    );
  });

  it("should throw error if priority is less than 1", async () => {
    const input = {
      input: {
        taskName: "Priority low",
        description: "Valid description text",
        priority: 0,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Priority must be between 1 and 5"
    );
  });

  it("should throw error if priority is more than 5", async () => {
    const input = {
      input: {
        taskName: "Priority high",
        description: "Valid description text",
        priority: 6,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Priority must be between 1 and 5"
    );
  });

  it("should throw error if tags exceed 5 items", async () => {
    const input = {
      input: {
        taskName: "Too many tags",
        description: "This description is valid",
        priority: 2,
        tags: ["a", "b", "c", "d", "e", "f"],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Tags cannot exceed 5 items"
    );
  });

  it("should throw error if task already exists for user", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue({ _id: "existingId" });

    const input = {
      input: {
        taskName: "Existing Task",
        description: "This is a valid description",
        priority: 2,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle mongoose ValidationError", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockRejectedValue({
      name: "ValidationError",
      errors: {
        taskName: { message: "Task name is required" },
        priority: { message: "Priority must be between 1 and 5" }
      }
    });

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "Valid task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Validation Error: Task name is required, Priority must be between 1 and 5"
    );
  });

  it("should handle mongoose duplicate key error (code 11000)", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockRejectedValue({
      code: 11000,
      message: "E11000 duplicate key error"
    });

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "Duplicate task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle generic error with message property", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockRejectedValue({
      message: "Database connection failed"
    });

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "Valid task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Failed to create task: Database connection failed"
    );
  });

  it("should handle generic error without message property", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockRejectedValue("Simple string error");

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "Valid task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Failed to create task: Simple string error"
    );
  });

  it("should handle findOne database error", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockRejectedValue(
      new Error("Database connection lost")
    );

    const input = {
      input: {
        taskName: "Valid task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Failed to create task: Database connection lost"
    );
  });

  it("should handle null/undefined error", async () => {
    (Task.findOne as jest.MockedFunction<typeof Task.findOne>).mockResolvedValue(null);

    const saveMock = jest.fn().mockRejectedValue(null);

    (Task as unknown as jest.Mock).mockImplementation(() => ({
      save: saveMock,
    }));

    const input = {
      input: {
        taskName: "Valid task",
        description: "Valid description here",
        priority: 3,
        tags: [],
        userId: "1",
      },
    };

    await expect(addTask({}, input)).rejects.toThrow(
      "Failed to create task: null"
    );
  });
});