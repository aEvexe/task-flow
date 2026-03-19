import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: String, enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ type: Number, default: 0 })
  position: number;

  @Prop()
  dueDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
  board: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
