import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { User, UserDocument, AuthProvider, UserStatus } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(data: {
    name: string;
    email: string;
    password?: string;
    authProvider?: AuthProvider;
    status?: UserStatus;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      ...data,
      authProvider: data.authProvider || AuthProvider.Email,
      status: data.status || UserStatus.Pending,
    });
    return user.save();
  }

  async updateById(id: string, update: UpdateQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async updateOne(filter: Record<string, any>, update: UpdateQuery<UserDocument>): Promise<void> {
    await this.userModel.updateOne(filter, update).exec();
  }
}
