import { getUserActiveTasksLists } from "graphql/resolvers/queries";
import { GraphQLError } from "graphql";
import { Task as TaskOriginal } from "../../models/index";

jest.mock("../../models/index", () => {
  return {
    Task: {
      findOne: jest.fn(),
      find: jest.fn(() => ({
        sort: jest.fn().mockReturnThis(),
      })),
    },
  };
});

const Task = require("../../models/index").Task as jest.Mocked<typeof TaskOriginal>;

describe("getUserActiveTasksLists query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if userId is missing", async () => {
    await expect(getUserActiveTasksLists({}, { userId: "" })).rejects.toThrow(
      new GraphQLError("userId is required")
    );
  });

  it("should throw an error if userId is null/undefined", async () => {
    await expect(getUserActiveTasksLists({}, { userId: null as any })).rejects.toThrow(
      new GraphQLError("userId is required")
    );
  });

  it("should throw an error if user is not found", async () => {
    Task.findOne.mockResolvedValue(null);

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("User not found")
    );

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "1" });
  });

  it("should return active tasks sorted by priority and createdAt when user exists", async () => {
    const mockUser = { _id: "user1", userId: "1" };
    const mockActiveTasks = [
      {
        _id: "task1",
        taskName: "High priority task",
        description: "This is a high priority task",
        priority: 5,
        tags: ["urgent"],
        userId: "1",
        isDone: false,
        createdAt: new Date("2023-01-01"),
      },
      {
        _id: "task2",
        taskName: "Medium priority task",
        description: "This is a medium priority task",
        priority: 3,
        tags: ["work"],
        userId: "1",
        isDone: false,
        createdAt: new Date("2023-01-02"),
      },
    ];

    const mockSort = jest.fn().mockResolvedValue(mockActiveTasks);
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

    Task.findOne.mockResolvedValue(mockUser);
    (Task.find as jest.Mock) = mockFind;

    const result = await getUserActiveTasksLists({}, { userId: "1" });

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "1" });
    expect(Task.find).toHaveBeenCalledWith({
      userId: "1",
      isDone: false,
    });
    expect(mockSort).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
    expect(result).toEqual(mockActiveTasks);
  });

  it("should return empty array when user exists but has no active tasks", async () => {
    const mockUser = { _id: "user1", userId: "1" };
    const emptyTasks: any[] = [];

    const mockSort = jest.fn().mockResolvedValue(emptyTasks);
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

    Task.findOne.mockResolvedValue(mockUser);
    (Task.find as jest.Mock) = mockFind;

    const result = await getUserActiveTasksLists({}, { userId: "1" });

    expect(result).toEqual([]);
    expect(Task.find).toHaveBeenCalledWith({
      userId: "1",
      isDone: false,
    });
  });

  it("should return only tasks with isDone: false", async () => {
    const mockUser = { _id: "user1", userId: "1" };
    const mockActiveTasks = [
      {
        _id: "task1",
        taskName: "Active task",
        description: "This task is not done",
        priority: 3,
        tags: [],
        userId: "1",
        isDone: false,
        createdAt: new Date(),
      },
    ];

    const mockSort = jest.fn().mockResolvedValue(mockActiveTasks);
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

    Task.findOne.mockResolvedValue(mockUser);
    (Task.find as jest.Mock) = mockFind;

    const result = await getUserActiveTasksLists({}, { userId: "1" });

    expect(Task.find).toHaveBeenCalledWith({
      userId: "1",
      isDone: false, 
    });
    expect(result).toEqual(mockActiveTasks);
  });

  it("should handle Error instance during findOne", async () => {
    Task.findOne.mockRejectedValue(new Error("DB connection error"));

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: DB connection error")
    );
  });

  it("should handle Error instance during find operation", async () => {
    const mockUser = { _id: "user1", userId: "1" };
    Task.findOne.mockResolvedValue(mockUser);

    const mockSort = jest.fn().mockRejectedValue(new Error("Sort operation failed"));
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
    (Task.find as jest.Mock) = mockFind;

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: Sort operation failed")
    );
  });

  it("should handle non-Error unknown errors", async () => {
    Task.findOne.mockRejectedValue("String error");

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: Unknown error")
    );
  });

  it("should handle null error", async () => {
    Task.findOne.mockRejectedValue(null);

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: Unknown error")
    );
  });

  it("should handle undefined error", async () => {
    Task.findOne.mockRejectedValue(undefined);

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: Unknown error")
    );
  });

  it("should handle object without message property", async () => {
    Task.findOne.mockRejectedValue({ code: 500, status: "error" });

    await expect(getUserActiveTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve active tasks: Unknown error")
    );
  });

  it("should handle different user IDs correctly", async () => {
    const mockUser = { _id: "user2", userId: "2" };
    const mockActiveTasks = [
      {
        _id: "task3",
        taskName: "Different user task",
        description: "This belongs to user 456",
        priority: 2,
        tags: ["personal"],
        userId: "2",
        isDone: false,
        createdAt: new Date(),
      },
    ];

    const mockSort = jest.fn().mockResolvedValue(mockActiveTasks);
    const mockFind = jest.fn().mockReturnValue({ sort: mockSort });

    Task.findOne.mockResolvedValue(mockUser);
    (Task.find as jest.Mock) = mockFind;

    const result = await getUserActiveTasksLists({}, { userId: "2" });

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "2" });
    expect(Task.find).toHaveBeenCalledWith({
      userId: "2",
      isDone: false,
    });
    expect(result).toEqual(mockActiveTasks);
  });
});