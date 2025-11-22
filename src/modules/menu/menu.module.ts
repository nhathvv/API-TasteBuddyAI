import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { AIAgentsModule } from '@/ai-agents/ai-agents.module';
import { JobQueueService } from '@/shared/services/job-queue.service';

@Module({
  imports: [AIAgentsModule],
  controllers: [MenuController],
  providers: [MenuService, JobQueueService],
  exports: [MenuService],
})
export class MenuModule { }
