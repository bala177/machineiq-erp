import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { SalesActor, SalesService } from './sales.service';
import { SalesAccessDto, SalesCommandDto, SalesCommentDto, SalesDocumentDto, SalesQueryDto, SalesSettingsDto, SalesSiteDto } from './sales.dto';

@Controller('sales')
@UseGuards(AuthGuard('jwt'))
export class SalesController {
  constructor(private readonly sales:SalesService) {}
  @Get('config') config(@CurrentUser() actor:SalesActor){return this.sales.config(actor);}
  @Patch('settings') settings(@Body() dto:SalesSettingsDto,@CurrentUser() actor:SalesActor){return this.sales.updateSettings(dto,actor);}
  @Patch('access') access(@Body() dto:SalesAccessDto,@CurrentUser() actor:SalesActor){return this.sales.access(dto,actor);}
  @Post('sites') site(@Body() dto:SalesSiteDto,@CurrentUser() actor:SalesActor){return this.sales.createSite(dto,actor);}
  @Get('records') list(@Query() query:SalesQueryDto,@CurrentUser() actor:SalesActor){return this.sales.list(query,actor);}
  @Post('records') create(@Body() dto:SalesDocumentDto,@CurrentUser() actor:SalesActor){return this.sales.save(dto,actor);}
  @Get('records/:id') detail(@Param('id',ParseUUIDPipe) id:string,@CurrentUser() actor:SalesActor){return this.sales.detail(id,actor);}
  @Patch('records/:id') update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:SalesDocumentDto,@CurrentUser() actor:SalesActor){return this.sales.save(dto,actor,id);}
  @Post('records/:id/actions') command(@Param('id',ParseUUIDPipe) id:string,@Body() dto:SalesCommandDto,@CurrentUser() actor:SalesActor){return this.sales.command(id,dto,actor);}
  @Post('records/:id/print') print(@Param('id',ParseUUIDPipe) id:string,@CurrentUser() actor:SalesActor){return this.sales.print(id,actor);}
  @Get('records/:id/compare/:other') compare(@Param('id',ParseUUIDPipe) id:string,@Param('other',ParseUUIDPipe) other:string,@CurrentUser() actor:SalesActor){return this.sales.compare(id,other,actor);}
  @Post('records/:id/comments') comment(@Param('id',ParseUUIDPipe) id:string,@Body() dto:SalesCommentDto,@CurrentUser() actor:SalesActor){return this.sales.comment(id,dto.type,dto.text,actor);}
  @Post('records/:id/attachments')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:8*1024*1024,files:1}}))
  upload(@Param('id',ParseUUIDPipe) id:string,@UploadedFile() file:{buffer:Buffer;originalname:string;mimetype:string},@CurrentUser() actor:SalesActor){return this.sales.attach(id,file,actor);}
  @Get('records/:id/attachments/:attachment')
  async download(@Param('id',ParseUUIDPipe) id:string,@Param('attachment',ParseUUIDPipe) attachment:string,@CurrentUser() actor:SalesActor,@Res() res:Response){const f=await this.sales.download(id,attachment,actor);res.setHeader('Content-Type',f.mime);res.setHeader('Content-Disposition',`attachment; filename="${f.name}"`);res.setHeader('X-Content-Type-Options','nosniff');res.send(f.content);}
  @Get('notifications') notifications(@CurrentUser() actor:SalesActor){return this.sales.notifications(actor);}
  @Patch('notifications/:id/read') read(@Param('id',ParseUUIDPipe) id:string,@CurrentUser() actor:SalesActor){return this.sales.readNotification(id,actor);}
  @Get('reports/:name') report(@Param('name') name:string,@Query() query:SalesQueryDto,@CurrentUser() actor:SalesActor){return this.sales.report(name,query,actor);}
  @Post('reports/:name/print') printReport(@Param('name') name:string,@Query() query:SalesQueryDto,@CurrentUser() actor:SalesActor){return this.sales.report(name,query,actor,true);}
  @Get('reports/:name/export/:format')
  async export(@Param('name') name:string,@Param('format') format:string,@Query() query:SalesQueryDto,@CurrentUser() actor:SalesActor,@Res() res:Response){
    const report=await this.sales.report(name,query,actor,true);
    const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Sales report');
    sheet.addRow([report.definition]);sheet.addRow(['Generated',report.generated_at,'By',report.generated_by]);sheet.addRow(['Filters',JSON.stringify(report.filters)]);
    if(report.rows.length){const keys=Object.keys(report.rows[0]);sheet.addRow(keys);for(const row of report.rows)sheet.addRow(keys.map(k=>row[k]));}
    if(format==='xlsx'){res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.setHeader('Content-Disposition',`attachment; filename="${name}.xlsx"`);res.send(Buffer.from(await workbook.xlsx.writeBuffer()));}
    else {res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition',`attachment; filename="${name}.csv"`);const safe=(v:unknown)=>'"'+String(v??'').replace(/^[=+@\-]/,"'"+'$&').replace(/"/g,'""')+'"';res.send('\ufeff'+[ [report.definition],['Generated',report.generated_at,'By',report.generated_by],['Filters',JSON.stringify(report.filters)],Object.keys(report.rows[0]||{}),...report.rows.map(r=>Object.values(r))].map(r=>r.map(safe).join(',')).join('\r\n'));}
  }
}
