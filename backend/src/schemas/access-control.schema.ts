import { Prop, Schema, SchemaFactory } from '../database/postgres-document.types';
import { DatabaseId, Document } from '../database/postgres-document.types';
import { Role } from '../common/enums';

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ required: true, unique: true, trim: true, lowercase: true }) code: string;
  @Prop({ required: true, trim: true }) module: string;
  @Prop({ required: true, trim: true }) action: string;
  @Prop({ trim: true }) description: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop({ type: Date, default: null }) deletedAt: Date | null;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
PermissionSchema.index({ module: 1, action: 1 });

@Schema({ timestamps: true })
export class RolePermission extends Document {
  @Prop({ required: true, enum: Role }) role: Role;
  @Prop({ required: true, type: DatabaseId, ref: Permission.name }) permissionId: DatabaseId;
  @Prop({ default: true }) allowed: boolean;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({ role: 1, permissionId: 1 }, { unique: true });
