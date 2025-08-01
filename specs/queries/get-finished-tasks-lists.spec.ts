import { getUserDoneTasksLists } from "graphql/resolvers/queries";
import { GraphQLError } from "graphql";
import { Task as TaskOriginal } from "../../models/index";

jest.mock("../../models/index", () => ({
  Task: {
    findOne: jest.fn(),
    find: jest.fn(),
  },
}));

const Task = require("../../models/index").Task as jest.Mocked<typeof TaskOriginal>;

describe("getUserDoneTasksLists query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw an error if userId is missing", async () => {
    await expect(getUserDoneTasksLists({}, { userId: "" })).rejects.toThrow(
      new GraphQLError("userId is required")
    );
  });

  it("should throw an error if userId is null/undefined", async () => {
    await expect(getUserDoneTasksLists({}, { userId: null as any })).rejects.toThrow(
      new GraphQLError("userId is required")
    );
  });

  it("should throw an error if user is not found", async () => {
    Task.findOne.mockResolvedValue(null);

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("User not found")
    );

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "1" });
  });

  it("should return done tasks sorted by updatedAt descending", async () => {
    Task.findOne.mockResolvedValue({ _id: "123" });

    const mockTasks = [
      { 
        _id: "task1",
        taskName: "Completed Task 1", 
        description: "This task was completed recently",
        priority: 3,
        tags: ["work"],
        userId: "1",
        isDone: true,
        updatedAt: new Date("2025-07-30") 
      },
      { 
        _id: "task2",
        taskName: "Completed Task 2", 
        description: "This task was completed earlier",
        priority: 1,
        tags: ["personal"],
        userId: "1",
        isDone: true,
        updatedAt: new Date("2025-07-29") 
      },
    ];

    const sortMock = jest.fn().mockResolvedValue(mockTasks);
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    const result = await getUserDoneTasksLists({}, { userId: "1" });

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "1" });
    expect(Task.find).toHaveBeenCalledWith({ userId: "1", isDone: true });
    expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(result).toEqual(mockTasks);
  });

  it("should return empty array when user has no completed tasks", async () => {
    Task.findOne.mockResolvedValue({ _id: "123" });

    const emptyTasks: any[] = [];

    const sortMock = jest.fn().mockResolvedValue(emptyTasks);
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    const result = await getUserDoneTasksLists({}, { userId: "1" });

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "1" });
    expect(Task.find).toHaveBeenCalledWith({ userId: "1", isDone: true });
    expect(sortMock).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(result).toEqual([]);
  });

  it("should return only tasks with isDone: true", async () => {
    Task.findOne.mockResolvedValue({ _id: "123" });

    const mockCompletedTasks = [
      {
        _id: "task1",
        taskName: "Done task",
        description: "This task is completed",
        priority: 2,
        tags: [],
        userId: "1",
        isDone: true,
        updatedAt: new Date(),
      },
    ];

    const sortMock = jest.fn().mockResolvedValue(mockCompletedTasks);
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    const result = await getUserDoneTasksLists({}, { userId: "1" });

    expect(Task.find).toHaveBeenCalledWith({
      userId: "1",
      isDone: true, 
    });
    expect(result).toEqual(mockCompletedTasks);
  });

  it("should handle different user IDs correctly", async () => {
    Task.findOne.mockResolvedValue({ _id: "user456" });

    const mockTasks = [
      {
        _id: "task3",
        taskName: "User 456 completed task",
        description: "This belongs to user 456",
        priority: 4,
        tags: ["urgent"],
        userId: "2",
        isDone: true,
        updatedAt: new Date(),
      },
    ];

    const sortMock = jest.fn().mockResolvedValue(mockTasks);
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    const result = await getUserDoneTasksLists({}, { userId: "2" });

    expect(Task.findOne).toHaveBeenCalledWith({ userId: "2" });
    expect(Task.find).toHaveBeenCalledWith({
      userId: "2",
      isDone: true,
    });
    expect(result).toEqual(mockTasks);
  });

  it("should handle Error instance during findOne", async () => {
    Task.findOne.mockRejectedValue(new Error("Database connection failed"));

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Database connection failed")
    );
  });

  it("should handle Error instance during find operation", async () => {
    Task.findOne.mockResolvedValue({ _id: "123" });

    const sortMock = jest.fn().mockRejectedValue(new Error("Sort operation failed"));
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Sort operation failed")
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    Task.findOne.mockRejectedValue(new Error("Unexpected DB error"));

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unexpected DB error")
    );
  });

  it("should handle non-Error unknown errors", async () => {
    Task.findOne.mockRejectedValue("String error");

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle null error", async () => {
    Task.findOne.mockRejectedValue(null);

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle undefined error", async () => {
    Task.findOne.mockRejectedValue(undefined);

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle object without message property", async () => {
    Task.findOne.mockRejectedValue({ code: 500, status: "error" });

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle number error", async () => {
    Task.findOne.mockRejectedValue(404);

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle boolean error", async () => {
    Task.findOne.mockRejectedValue(false);

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle find operation error after successful user check", async () => {
    Task.findOne.mockResolvedValue({ _id: "1" });

    const sortMock = jest.fn().mockRejectedValue("Database timeout");
    (Task.find as jest.Mock).mockReturnValue({ sort: sortMock });

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });

  it("should handle complex object error without Error properties", async () => {
    Task.findOne.mockRejectedValue({
      statusCode: 500,
      error: "Internal Server Error",
      details: { connection: "failed" }
    });

    await expect(getUserDoneTasksLists({}, { userId: "1" })).rejects.toThrow(
      new GraphQLError("Failed to retrieve completed tasks: Unknown error")
    );
  });
});