import { updateTask } from "@/graphql/resolvers/mutations";
import { Task as TaskDuplicate} from "@/mongoose/index";

jest.mock("@/mongoose/index", () => {
  return {
    Task: {
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  };
});

const Task = require("@/mongoose/index").Task as jest.Mocked<typeof TaskDuplicate>;

describe("updateTask mutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update a task successfully", async () => {
    const existingTask = {
      _id: "1",
      taskName: "Old task",
      description: "Old description is valid",
      priority: 3,
      tags: ["work"],
      userId: "1",
      isDone: false,
    };

    const updatedTask = {
      ...existingTask,
      taskName: "New task",
      description: "New description is valid",
      priority: 4,
      tags: ["home"],
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findOne as jest.Mock).mockResolvedValue(null); 
    (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedTask);

    const input = {
      input: {
        taskId: "1",
        userId: "1",
        taskName: "New task",
        description: "New description is valid",
        priority: 4,
        tags: ["home"],
      },
    };

    const result = await updateTask({}, input);

    expect(Task.findById).toHaveBeenCalledWith("1");
    expect(Task.findOne).toHaveBeenCalledWith({
      taskName: "New task",
      userId: "1",
      _id: { $ne: "1" },
    });
    expect(Task.findByIdAndUpdate).toHaveBeenCalledWith(
      "1",
      { $set: {
          taskName: "New task",
          description: "New description is valid",
          priority: 4,
          tags: ["home"],
        } },
      { new: true, runValidators: true }
    );
    expect(result).toEqual(updatedTask);
  });

  it("should update task without checking for duplicates when taskName unchanged", async () => {
    const existingTask = {
      _id: "1",
      taskName: "Same task name",
      description: "Old description is valid",
      priority: 3,
      tags: ["work"],
      userId: "1",
      isDone: false,
    };

    const updatedTask = {
      ...existingTask,
      description: "New description is valid",
      priority: 4,
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedTask);

    const input = {
      input: {
        taskId: "1",
        userId: "1",
        taskName: "Same task name", 
        description: "New description is valid",
        priority: 4,
      },
    };

    const result = await updateTask({}, input);

    expect(Task.findById).toHaveBeenCalledWith("1");
    expect(Task.findOne).not.toHaveBeenCalled(); 
    expect(result).toEqual(updatedTask);
  });

  it("should update task with only isDone field", async () => {
    const existingTask = {
      _id: "1",
      taskName: "Task name",
      description: "Valid description here",
      priority: 3,
      tags: ["work"],
      userId: "1",
      isDone: false,
    };

    const updatedTask = { ...existingTask, isDone: true };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedTask);

    const input = {
      input: {
        taskId: "1",
        userId: "1",
        isDone: true,
      },
    };

    const result = await updateTask({}, input);

    expect(result?.isDone).toBe(true);
    expect(Task.findOne).not.toHaveBeenCalled(); 
  });

  it("should throw if taskId missing", async () => {
    const input = {
      input: { userId: "1" },
    };
    await expect(updateTask({}, input as any)).rejects.toThrow("taskId and userId are required");
  });

  it("should throw if userId missing", async () => {
    const input = {
      input: { taskId: "1" },
    };
    await expect(updateTask({}, input as any)).rejects.toThrow("taskId and userId are required");
  });

  it("should throw if task not found", async () => {
    (Task.findById as jest.Mock).mockResolvedValue(null);
    const input = {
      input: { taskId: "1", userId: "1" },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Task not found");
  });

  it("should throw if userId mismatches", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({ userId: "999" });
    const input = {
      input: { taskId: "1", userId: "1" },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Unauthorized: You can only update your own tasks");
  });

  it("should throw if description less than 10 chars", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Task 1",
    });
    const input = {
      input: { taskId: "1", userId: "1", description: "short" },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Description must be at least 10 characters long");
  });

  it("should throw if description equals existing taskName when taskName not provided", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Same text value",
    });
    const input = {
      input: { taskId: "1", userId: "1", description: "Same text value" },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Description cannot be the same as taskName");
  });

  it("should throw if description equals new taskName when both provided", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Old task name",
    });
    const input = {
      input: { 
        taskId: "1", 
        userId: "1", 
        description: "New task name", 
        taskName: "New task name" 
      },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Description cannot be the same as taskName");
  });

  it("should throw if priority is less than 1", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Task 1",
    });
    const input = {
      input: { taskId: "1", userId: "1", priority: 0 },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Priority must be between 1 and 5");
  });

  it("should throw if priority is greater than 5", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Task 1",
    });
    const input = {
      input: { taskId: "1", userId: "1", priority: 6 },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Priority must be between 1 and 5");
  });

  it("should throw if tags exceed 5 items", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Task 1",
    });
    const input = {
      input: { taskId: "1", userId: "1", tags: ["a","b","c","d","e","f"] },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Tags cannot exceed 5 items");
  });

  it("should allow empty tags array", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Task 1",
      description: "Valid description",
      tags: ["old", "tags"],
    };

    const updatedTask = { ...existingTask, tags: [] };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedTask);

    const input = {
      input: { taskId: "1", userId: "1", tags: [] },
    };

    const result = await updateTask({}, input);
    expect(result?.tags).toEqual([]);
  });

  it("should throw if duplicate taskName exists", async () => {
    (Task.findById as jest.Mock).mockResolvedValue({
      userId: "1",
      taskName: "Old Task",
    });
    (Task.findOne as jest.Mock).mockResolvedValue({ _id: "2" }); 
    const input = {
      input: { taskId: "1", userId: "1", taskName: "Duplicate Task" },
    };
    await expect(updateTask({}, input)).rejects.toThrow("Task with this name already exists for this user");
  });

  it("should handle mongoose ValidationError during update", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Valid task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockRejectedValue({
      name: "ValidationError",
      errors: {
        description: { message: "Description is too short" },
        priority: { message: "Priority out of range" }
      }
    });

    const input = {
      input: { taskId: "1", userId: "1", description: "Valid description here" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Validation Error: Description is too short, Priority out of range"
    );
  });

  it("should handle mongoose duplicate key error (code 11000) during update", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Old task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findOne as jest.Mock).mockResolvedValue(null); 
    (Task.findByIdAndUpdate as jest.Mock).mockRejectedValue({
      code: 11000,
      message: "E11000 duplicate key error"
    });

    const input = {
      input: { taskId: "1", userId: "1", taskName: "New task name" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Task with this name already exists for this user"
    );
  });

  it("should handle generic error with message property during findById", async () => {
    (Task.findById as jest.Mock).mockRejectedValue({
      message: "Database connection failed"
    });

    const input = {
      input: { taskId: "1", userId: "1" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Failed to update task: Database connection failed"
    );
  });

  it("should handle generic error with message property during findByIdAndUpdate", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Valid task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockRejectedValue({
      message: "Connection timeout"
    });

    const input = {
      input: { taskId: "1", userId: "1", description: "New description here" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Failed to update task: Connection timeout"
    );
  });

  it("should handle generic error without message property", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Valid task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockRejectedValue("Simple string error");

    const input = {
      input: { taskId: "1", userId: "1", description: "New description here" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Failed to update task: Simple string error"
    );
  });

  it("should handle null error", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Valid task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findByIdAndUpdate as jest.Mock).mockRejectedValue(null);

    const input = {
      input: { taskId: "1", userId: "1", description: "New description here" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Failed to update task: null"
    );
  });

  it("should handle error during duplicate check", async () => {
    const existingTask = {
      userId: "1",
      taskName: "Old task",
    };

    (Task.findById as jest.Mock).mockResolvedValue(existingTask);
    (Task.findOne as jest.Mock).mockRejectedValue(new Error("Database error during duplicate check"));

    const input = {
      input: { taskId: "1", userId: "1", taskName: "New task name" },
    };

    await expect(updateTask({}, input)).rejects.toThrow(
      "Failed to update task: Database error during duplicate check"
    );
  });
});