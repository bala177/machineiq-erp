import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { Role } from '../common/enums';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: Role, default: Role.DESIGNER })
  role: Role;

  @Prop({ type: DatabaseId, ref: 'Department' })
  departmentId: DatabaseId;

  @Prop({ trim: true })
  title: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ role: 1 });
UserSchema.index({ departmentId: 1 });
