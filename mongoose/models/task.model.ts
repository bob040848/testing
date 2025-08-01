import { Schema, model, Model, models } from "mongoose";

type TaskSchemaType = {
  taskName: string;
  description: string; 
  isDone: boolean;
  priority: number;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

const taskSchema = new Schema<TaskSchemaType>(
  {
    taskName: { type: String, required: true },
    description: {
      type: String,
      required: true,
      minlength: 10,
      validate: {
        validator: function (this: TaskSchemaType, value: string) {
          return value !== this.taskName;
        },
        message: "Description can't be same as taskName",
      },
    },
    isDone: { type: Boolean, default: false },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tags: {
      type: [String],
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 5;
        },
        message: "Tags cannot exceed 5 items",
      },
    },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

taskSchema.index({ taskName: 1, userId: 1 }, { unique: true });

export const Task: Model<TaskSchemaType> =
  models.Task || model<TaskSchemaType>("Task", taskSchema);
