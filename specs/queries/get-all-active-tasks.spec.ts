import { getAllActiveTasks } from "@/graphql/resolvers/queries/get-all-active-tasks";
import { Task } from "@/mongoose/index";
import { GraphQLError } from "graphql";

jest.mock("@/mongoose/index", () => ({
  Task: {
    findOne: jest.fn(),
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        sort: jest.fn(),
      })),
    })),
  },
}));

const MockedTask = Task as jest.Mocked<typeof Task>;

describe("Get All Active Tasks Query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockActiveTasks = [
    {
      _id: "task1",
      taskName: "High Priority Task",
      description: "This is a high priority task description",
      priority: 5,
      isDone: false,
      userId: "user123",
      tags: ["urgent", "work"],
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    {
      _id: "task2", 
      taskName: "Medium Priority Task",
      description: "This is a medium priority task description",
      priority: 3,
      isDone: false,
      userId: "user123",
      tags: ["work"],
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
    },
    {
      _id: "task3",
      taskName: "Low Priority Task", 
      description: "This is a low priority task description",
      priority: 1,
      isDone: false,
      userId: "user123",
      tags: ["personal"],
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date("2024-01-03"),
    },
  ];

  it("should successfully retrieve active tasks for valid user", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
    };
    mockFind.sort.mockResolvedValue(mockActiveTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    const result = await getAllActiveTasks({}, { userId });

    expect(MockedTask.findOne).toHaveBeenCalledWith({ userId });
    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: false,
    });
    expect(mockFind.sort).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
    expect(result).toEqual(mockActiveTasks);
  });

  it("should throw error when userId is not provided", async () => {
    await expect(getAllActiveTasks({}, { userId: "" })).rejects.toThrow(GraphQLError);
    await expect(getAllActiveTasks({}, { userId: "" })).rejects.toThrow("userId is needed");
  });

  it("should throw error when user does not exist", async () => {
    const userId = "nonexistentUser";
    
    MockedTask.findOne.mockResolvedValue(null);

    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow("User not found");
  });

  it("should return empty array when user has no active tasks", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
    };
    mockFind.sort.mockResolvedValue([]);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    const result = await getAllActiveTasks({}, { userId });

    expect(result).toEqual([]);
    expect(MockedTask.find).toHaveBeenCalledWith({
      userId,
      isDone: false,
    });
  });

  it("should handle database errors gracefully", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
    };
    mockFind.sort.mockRejectedValue(new Error("Database connection error"));
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(
      "Failed to retrieve active tasks: Database connection error"
    );
  });

  it("should handle unknown errors", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
    };
    mockFind.sort.mockRejectedValue("Unknown error");
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(
      "Failed to retrieve active tasks: Unknown error"
    );
  });

  it("should sort tasks by priority descending then by createdAt descending", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockResolvedValue({ userId });
    
    const mockFind = {
      sort: jest.fn().mockReturnThis(),
    };
    mockFind.sort.mockResolvedValue(mockActiveTasks);
    
    (MockedTask.find as jest.Mock).mockReturnValue(mockFind);

    await getAllActiveTasks({}, { userId });

    expect(mockFind.sort).toHaveBeenCalledWith({ priority: -1, createdAt: -1 });
  });

  it("should handle GraphQL errors and re-throw them", async () => {
    const userId = "user123";
    
    MockedTask.findOne.mockRejectedValue(new GraphQLError("Custom GraphQL error"));

    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow(GraphQLError);
    await expect(getAllActiveTasks({}, { userId })).rejects.toThrow("Custom GraphQL error");
  });
});