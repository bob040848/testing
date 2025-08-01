import { getFinishedTasksLists } from "@/graphql/resolvers/queries/get-finished-tasks-lists";
import { Task } from "@/mongoose/index";
import { GraphQLError } from "graphql";

jest.mock("@/mongoose/index", () => ({
  Task: {
    findOne: jest.fn(),
    find: jest.fn(() => ({
      sort: jest.fn(),
    })),
  },
}));

const MockedTask = Task as jest.Mocked<typeof Task>;

describe("Get Finished Tasks Lists Query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFinishedTasks = [
    {
      _id: "task1",
      taskName: "Completed Task 1",
      description: "This is a completed task description",
      priority: 3,
      isDone: true,
      userId: "user123",
      tags: ["work", "completed"],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-05"),
    },
    {
      _id: "task2",
      taskName: "Completed Task 2", 
      description: "This is another completed task description",
      priority: 5,
      isDone: true,
      userId: "user123",
      tags: ["personal", "completed"],
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-04"),
    },
    {
      _id: "task3",
      taskName: "Completed Task 3",
      description: "This is yet another completed task description",
      priority: 1,
      isDone: true,
      userId: "user123", 
      tags: ["urgent", "completed"],
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    },
  ];

  it("should successfully retrieve finished tasks for valid user", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockResolvedValue(mockFinishedTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    const result = await getFinishedTasksLists({}, { userId });

    expect(MockedTask.findOne).toHaveBeenCalledWith({ userId });
    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: true,
    });
    expect(mockFind.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(result).toEqual(mockFinishedTasks);
  });

  it("should throw error when userId is not provided", async () => {
    await expect(getFinishedTasksLists({}, { userId: "" })).rejects.toThrow(GraphQLError);
    await expect(getFinishedTasksLists({}, { userId: "" })).rejects.toThrow("userId is needed");
  });

  it("should throw error when user does not exist", async () => {
    const userId = "nonexistentUser";
    
    MockedTask.findOne.mockResolvedValue(null);

    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow("User not found");
  });

  it("should return empty array when user has no finished tasks", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockResolvedValue([]);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    const result = await getFinishedTasksLists({}, { userId });

    expect(result).toEqual([]);
    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: true,
    });
  });

  it("should handle database errors gracefully", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockRejectedValue(new Error("Database connection error"));
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(
      "Failed to retrieve finished tasks: Database connection error"
    );
  });

  it("should handle unknown errors", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockRejectedValue("Unknown error");
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(
      "Failed to retrieve finished tasks: Unknown error"
    );
  });

  it("should sort tasks by updatedAt descending", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockResolvedValue(mockFinishedTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await getFinishedTasksLists({}, { userId });

    expect(mockFind.sort).toHaveBeenCalledWith({ updatedAt: -1 });
  });

  it("should handle GraphQL errors and re-throw them", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockRejectedValue(new GraphQLError("Custom GraphQL error"));

    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getFinishedTasksLists({}, { userId })).rejects.toThrow("Custom GraphQL error");
  });

  it("should only return tasks where isDone is true", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockResolvedValue(mockFinishedTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await getFinishedTasksLists({}, { userId });

    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: true,
    });
  });

  it("should verify user exists before querying finished tasks", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn(),
    };
    mockFind.sort.mockResolvedValue(mockFinishedTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await getFinishedTasksLists({}, { userId });

    expect(MockedTask.findOne).toHaveBeenCalledWith({ userId });
    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: true,
    });
  });
});