import { Injectable } from '@nestjs/common';
import { InjectPgModel } from '../../database/postgres-document.module';
import { Model } from '../../database/postgres-document.model';
import { DatabaseId } from '../../database/postgres-document.types';
import { Notification } from '../../schemas/notification.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectPgModel(Notification.name) private notificationModel: Model<Notification>,
    private gateway: NotificationsGateway,
  ) {}

  async create(dto: Partial<Notification>) {
    const notification = await this.notificationModel.create(dto);
    this.gateway.sendToUser(dto.userId?.toString() || '', notification);
    return notification;
  }

  async findByUser(userId: string, query: { read?: string; limit?: number }) {
    const filter: any = { userId };
    if (query.read !== undefined) filter.read = query.read === 'true';
    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(query.limit || 50)
      .exec();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(id, { $set: { read: true } }, { new: true });
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany({ userId, read: false }, { $set: { read: true } });
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({ userId, read: false });
    return { count };
  }
}
