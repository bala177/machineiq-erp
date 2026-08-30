import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ComponentsService } from './components.service';

@Injectable()
export class ComponentReminderWorker implements OnModuleInit, OnModuleDestroy {
  private intervalHandle: NodeJS.Timeout | null = null;

  constructor(private readonly componentsService: ComponentsService) {}

  onModuleInit() {
    this.intervalHandle = setInterval(() => {
      void this.componentsService.processReminders().catch(() => {});
    }, 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
