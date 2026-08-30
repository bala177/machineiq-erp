import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  createDocument(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.documentsService.createDocument({ ...dto, uploadedBy: userId });
  }

  @Get()
  findDocuments(@Query('projectId') projectId: string) {
    return this.documentsService.findDocuments(projectId);
  }

  @Delete(':id')
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }

  @Post('decisions')
  createDecision(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.documentsService.createDecision({ ...dto, madeBy: userId });
  }

  @Get('decisions')
  findDecisions(@Query('projectId') projectId: string) {
    return this.documentsService.findDecisions(projectId);
  }

  @Post('comments')
  createComment(@Body() dto: any, @CurrentUser('userId') userId: string) {
    return this.documentsService.createComment({ ...dto, authorId: userId });
  }

  @Get('comments')
  findComments(@Query() query: { taskId?: string; deliverableId?: string; projectId?: string }) {
    return this.documentsService.findComments(query);
  }
}
