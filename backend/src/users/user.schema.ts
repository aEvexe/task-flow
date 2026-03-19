import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type UserDocument = User & Document;

export enum AuthProvider {
  Email = 'email',
  Google = 'google',
}

export enum UserStatus {
  Pending = 'pending',
  Active = 'active',
  Failed = 'failed',
}

@Schema({ timestamps: true })
export class User {
  _id?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false, select: false })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(AuthProvider),
    default: AuthProvider.Email,
  })
  authProvider: AuthProvider;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.Pending,
  })
  status: UserStatus;

  @Prop()
  verificationCode: string;

  @Prop()
  verificationCodeExpiry: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
