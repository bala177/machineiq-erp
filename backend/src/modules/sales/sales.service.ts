import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash, randomUUID } from 'crypto';
import { isUUID } from 'class-validator';
import { SalesAccessDto, SalesCommandDto, SalesDocumentDto, SalesQueryDto, SalesSettingsDto, SalesSiteDto } from './sales.dto';
import { amountUnits, moneyString, salesTotals } from './sales-money';
import { auditRequestContext } from '../audit-log/audit-context';

export type SalesActor = { userId: string; role?: string };
type Row = Record<string, any>;
type Context = { userId: string; companyId: string; role: string; scope: string; permissions: string[] };
const fields = ['title','machine_category','quantity','document_date','valid_until','start_date','delivery_date','scope','exclusions','warranty','terms','customer_po','inquiry_source'];
const terminal = ['superseded','cancelled','closed','completed','lost','rejected','expired'];

@Injectable()
export class SalesService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private readonly logger=new Logger(SalesService.name);
  constructor(private readonly db: DataSource) {}
  onModuleInit() { this.timer=setInterval(()=>{ void this.reminders().catch(()=>this.logger.error('Sales reminders failed; retained source records will be retried in one minute')); },60000); this.timer.unref(); }
  onModuleDestroy() { if(this.timer) clearInterval(this.timer); }

  private async context(actor: SalesActor, action='view', m=this.db.manager): Promise<Context> {
    const [user]=await m.query(`SELECT id,role FROM users WHERE id=$1 AND is_active AND deleted_at IS NULL`,[actor.userId]);
    if(!user) throw new ForbiddenException('Your account is inactive');
    const permissions=await m.query(`SELECT p.action FROM permissions p JOIN role_permissions rp ON rp.permission_id=p.id JOIN roles rr ON rr.id=rp.role_id WHERE p.module='sales' AND p.is_active AND p.deleted_at IS NULL AND rp.allowed AND rr.is_active AND rr.deleted_at IS NULL AND rr.key=$1`,[user.role]);
    if(!permissions.some((p:Row)=>p.action===action)) throw new ForbiddenException(`Sales ${action} permission is required`);
    let [access]=await m.query(`SELECT a.* FROM sales_access a JOIN companies c ON c.id=a.company_id WHERE a.user_id=$1 AND c.is_active AND c.deleted_at IS NULL`,[actor.userId]);
    if(!access) {
      const companies=await m.query(`SELECT id FROM companies WHERE is_active AND deleted_at IS NULL ORDER BY created_at`);
      if(companies.length!==1) throw new BadRequestException('Configure one active Release 1 organization before using Sales');
      await m.query(`INSERT INTO sales_access(user_id,company_id,scope) VALUES($1,$2,$3) ON CONFLICT(user_id) DO NOTHING`,[actor.userId,companies[0].id,['admin','manager','leadership'].includes(user.role)?'all':'own']);
      [access]=await m.query(`SELECT * FROM sales_access WHERE user_id=$1`,[actor.userId]);
    }
    return {userId:actor.userId,companyId:access.company_id,scope:access.scope,role:user.role,permissions:permissions.map((p:Row)=>p.action)};
  }
  private allowed(row:Row,c:Context) { return row.company_id===c.companyId && (c.scope==='all'||row.owner_id===c.userId||row.created_by===c.userId); }
  private async record(id:string,c:Context,m=this.db.manager,lock=false):Promise<Row> {
    if(!isUUID(id)) throw new NotFoundException('Sales record not found');
    const [row]=await m.query(`SELECT * FROM sales_records WHERE id=$1 ${lock?'FOR UPDATE':''}`,[id]);
    if(!row||!this.allowed(row,c)) throw new NotFoundException('Sales record not found');
    return row;
  }
  private async settings(companyId:string,m=this.db.manager) {
    await m.query(`INSERT INTO sales_settings(company_id) VALUES($1) ON CONFLICT DO NOTHING`,[companyId]);
    return (await m.query(`SELECT * FROM sales_settings WHERE company_id=$1`,[companyId]))[0];
  }
  private async master(table:string,id:string,m:EntityManager) {
    // table is always an internal literal, never request input.
    const [row]=await m.query(`SELECT * FROM ${table} WHERE id=$1 AND deleted_at IS NULL AND ${table==='customers'?"account_type NOT IN ('inactive','churned')":'is_active'}`,[id]);
    if(!row) throw new BadRequestException(`Select an active ${table === 'users' ? 'owner' : table.replace(/s$/,'')}`);
    return row;
  }
  private async references(doc:Row,c:Context,m:EntityManager) {
    const customer=await this.master('customers',doc.customer_id,m);
    const owner=await this.master('users',doc.owner_id,m);
    if(!['admin','manager','sales'].includes(owner.role)) throw new BadRequestException('The sales/project owner must be an administrator, manager or salesperson');
    if(c.scope==='own'&&doc.owner_id!==c.userId) throw new ForbiddenException('Only a manager can assign another owner');
    if(doc.branch_id) {
      const branch=await this.master('branches',doc.branch_id,m);
      if(branch.company_id!==c.companyId) throw new BadRequestException('Branch belongs to another organization');
    }
    let site=null;
    if(doc.site_id) {
      [site]=await m.query(`SELECT * FROM sales_sites WHERE id=$1 AND company_id=$2 AND customer_id=$3 AND active`,[doc.site_id,c.companyId,doc.customer_id]);
      if(!site) throw new BadRequestException('Select an active site belonging to this customer');
    }
    return {customer,site};
  }
  private async number(kind:string,c:Context,m:EntityManager) {
    const config=await this.settings(c.companyId,m);
    const [company]=await m.query(`SELECT code FROM companies WHERE id=$1`,[c.companyId]);
    const year=new Date().getUTCFullYear();
    const key=`sales:${c.companyId}:${kind}:${year}`;
    const [seq]=await m.query(`INSERT INTO sequences(key,value) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET value=sequences.value+1 RETURNING value`,[key]);
    return `${config.prefixes[kind]}-${company.code}-${year}-${String(seq.value).padStart(5,'0')}`;
  }
  private async event(m:EntityManager,row:Row,c:Context,action:string,reason='',changes:Row={}) {
    const [event]=await m.query(`INSERT INTO sales_events(record_id,actor_id,action,reason,changes) VALUES($1,$2,$3,$4,$5) RETURNING id`,[row.id,c.userId,action,reason,JSON.stringify(changes)]);
    await m.query(`INSERT INTO audit_logs(action,entity_type,entity_id,performed_by,project_id,new_values) VALUES($1,'SalesRecord',$2,$3,$4,$5)`,[action,row.id,c.userId,row.runtime_id||null,JSON.stringify({companyId:c.companyId,number:row.number,revision:row.revision,reason,...changes})]);
    auditRequestContext.markRecorded();
    if(!['view','export','update'].includes(action)) await m.query(`INSERT INTO sales_notifications(user_id,record_id,message,event_key)
      SELECT DISTINCT u.id,$1::uuid,$2::text,$3::text FROM users u JOIN sales_access a ON a.user_id=u.id
      WHERE a.company_id=$4 AND u.is_active AND u.deleted_at IS NULL
      AND (a.scope='all' OR u.id=$5 OR u.id=$6)
      AND EXISTS(SELECT 1 FROM permissions p JOIN role_permissions rp ON rp.permission_id=p.id JOIN roles rr ON rr.id=rp.role_id WHERE p.code='sales.view' AND p.is_active AND p.deleted_at IS NULL AND rr.key=u.role AND rr.is_active AND rr.deleted_at IS NULL AND rp.allowed)
      ON CONFLICT DO NOTHING`,[row.id,`${row.number} r${row.revision}: ${action.replace(/_/g,' ')}`,event.id,c.companyId,row.owner_id,row.created_by]);
  }

  async config(actor:SalesActor) {
    const c=await this.context(actor);
    const [company]=await this.db.query(`SELECT id,name,code,base_currency,timezone FROM companies WHERE id=$1`,[c.companyId]);
    const [customers,users,branches,items,uoms,sites]=await Promise.all([
      this.db.query(`SELECT id,name,code FROM customers WHERE account_type NOT IN ('inactive','churned') AND deleted_at IS NULL ORDER BY name`),
      this.db.query(`SELECT id,first_name,last_name,role,department_id FROM users WHERE is_active AND deleted_at IS NULL AND role::text IN ('admin','manager','sales') ORDER BY first_name`),
      this.db.query(`SELECT id,name FROM branches WHERE company_id=$1 AND is_active AND deleted_at IS NULL`,[c.companyId]),
      this.db.query(`SELECT id,code,name,selling_price,uom_id,tax_percent FROM items WHERE is_active AND deleted_at IS NULL ORDER BY code`),
      this.db.query(`SELECT id,name,code FROM uoms WHERE is_active AND deleted_at IS NULL ORDER BY name`),
      this.db.query(`SELECT * FROM sales_sites WHERE company_id=$1 AND active ORDER BY name`,[c.companyId]),
    ]);
    return {company,customers,users,branches,items,uoms,sites,permissions:c.permissions,access:c.scope,settings:await this.settings(c.companyId)};
  }
  async createSite(dto:SalesSiteDto,actor:SalesActor) {
    return this.db.transaction(async m=>{
      const c=await this.context(actor,'create',m);await this.master('customers',dto.customer_id,m);
      const [site]=await m.query(`INSERT INTO sales_sites(company_id,customer_id,name,address,contact) VALUES($1,$2,$3,$4,$5) RETURNING *`,[c.companyId,dto.customer_id,dto.name.trim(),dto.address.trim(),dto.contact.trim()]);
      await m.query(`INSERT INTO audit_logs(action,entity_type,entity_id,performed_by,new_values) VALUES('create','CustomerSite',$1,$2,$3)`,[site.id,c.userId,JSON.stringify({companyId:c.companyId,...dto})]);
      return site;
    });
  }
  async updateSettings(dto:SalesSettingsDto,actor:SalesActor) {
    if(Object.keys(dto.currencies).length<1||Object.keys(dto.currencies).length>50||Object.entries(dto.currencies).some(([k,v])=>!(/^[A-Z]{3}$/.test(k))||!Number.isInteger(v)||v<0||v>4)) throw new BadRequestException('Currencies require ISO codes and precision from 0 to 4');
    if(['enquiry','quote','order','project'].some(k=>typeof dto.prefixes[k]!=='string'||!(/^[A-Z0-9]{1,12}$/.test(dto.prefixes[k])))) throw new BadRequestException('Define a 1–12 character uppercase prefix for each document type');
    return this.db.transaction(async m=>{ const c=await this.context(actor,'administer',m);await this.settings(c.companyId,m);
      await m.query(`UPDATE sales_settings SET separate_approver=$2,currencies=$3,taxes=$4,prefixes=$5 WHERE company_id=$1`,[c.companyId,dto.separate_approver,JSON.stringify(dto.currencies),JSON.stringify(dto.taxes),JSON.stringify(dto.prefixes)]);
      await m.query(`INSERT INTO audit_logs(action,entity_type,entity_id,performed_by,new_values) VALUES('update','SalesSettings',$1,$2,$3)`,[c.companyId,c.userId,JSON.stringify(dto)]);
      return this.settings(c.companyId,m);
    });
  }
  async access(dto:SalesAccessDto,actor:SalesActor) {
    return this.db.transaction(async m=>{const c=await this.context(actor,'administer',m);await this.master('users',dto.user_id,m);
      await m.query(`INSERT INTO sales_access(user_id,company_id,scope) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET company_id=$2,scope=$3`,[dto.user_id,c.companyId,dto.scope]);
      await m.query(`INSERT INTO audit_logs(action,entity_type,entity_id,performed_by,new_values) VALUES('update','SalesAccess',$1,$2,$3)`,[dto.user_id,c.userId,JSON.stringify(dto)]);return {ok:true};
    });
  }

  private async content(m:EntityManager,row:Row,dto:SalesDocumentDto,precision:number) {
    if(new Set(dto.lines.map(l=>l.line_key).filter(Boolean)).size!==dto.lines.filter(l=>l.line_key).length) throw new BadRequestException('Duplicate line identifiers');
    const settings=await this.settings(row.company_id,m);
    for(const line of dto.lines) {
      if(!settings.taxes.includes(line.tax_percent)) throw new BadRequestException('Select a configured tax rate');
      if(line.item_id) {
        const item=await this.master('items',line.item_id,m);
        if(item.uom_id!==line.uom_id)throw new BadRequestException('Use the item master unit for a quotation line');
      }
      if(line.uom_id) {
        const uom=await this.master('uoms',line.uom_id,m);
        if(line.unit!==uom.code)throw new BadRequestException('The line unit must match its selected unit master');
      }
    }
    const totals=salesTotals(dto.lines,precision);
    if(row.kind==='order'&&row.source_id) {
      const sourceLines=await m.query(`SELECT * FROM sales_lines WHERE record_id=$1 ORDER BY position`,[row.source_id]);
      const immutable=['line_key','item_id','uom_id','description','unit','quantity','unit_price','discount_percent','tax_percent'];
      if(sourceLines.length!==dto.lines.length||sourceLines.some((source:Row,i:number)=>immutable.some(k=>{
        const a=source[k],b=(dto.lines[i] as unknown as Row)[k];
        return ['quantity','unit_price','discount_percent','tax_percent'].includes(k)?Number(a)!==Number(b):String(a||'')!==String(b||'');
      })))throw new BadRequestException('Order lines must match the accepted quotation. Revise the quotation before changing quantities or prices.');
    }
    const sourceLines:Row[]=row.source_id?await m.query(`SELECT id,line_key FROM sales_lines WHERE record_id=$1`,[row.source_id]):[];
    await m.query(`DELETE FROM sales_lines WHERE record_id=$1`,[row.id]);
    for(let i=0;i<totals.lines.length;i++) {
      const l=totals.lines[i];await m.query(`INSERT INTO sales_lines(record_id,line_key,item_id,uom_id,description,unit,quantity,unit_price,discount_percent,tax_percent,net,tax,gross,position) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,[row.id,l.line_key||randomUUID(),l.item_id||null,l.uom_id||null,l.description.trim(),l.unit.trim(),l.quantity,l.unit_price,l.discount_percent,l.tax_percent,l.net,l.tax,l.gross,i]);
      const source=sourceLines.find(s=>s.line_key===l.line_key);
      if(source)await m.query(`UPDATE sales_lines SET source_line_id=$3 WHERE record_id=$1 AND line_key=$2`,[row.id,l.line_key,source.id]);
    }
    await m.query(`DELETE FROM sales_milestones WHERE record_id=$1`,[row.id]);
    for(let i=0;i<dto.milestones.length;i++) {
      const p=dto.milestones[i];amountUnits(p.amount,precision);
      if(!p.trigger.trim()&&!p.due_date) throw new BadRequestException('Every milestone needs a due date or event trigger');
      await m.query(`INSERT INTO sales_milestones(record_id,label,trigger,due_date,amount,position) VALUES($1,$2,$3,$4,$5,$6)`,[row.id,p.label.trim(),p.trigger.trim(),p.due_date||null,p.amount,i]);
    }
    await m.query(`UPDATE sales_records SET net=$2,tax=$3,gross=$4 WHERE id=$1`,[row.id,totals.net,totals.tax,totals.gross]);
    return totals;
  }
  async save(dto:SalesDocumentDto,actor:SalesActor,id?:string) {
    return this.db.transaction(async m=>{
      const c=await this.context(actor,id?'edit':'create',m);
      const config=await this.settings(c.companyId,m);const precision=config.currencies[dto.currency];
      if(precision===undefined) throw new BadRequestException('Select a configured currency');
      await this.references(dto,c,m);
      let row:Row;
      if(id) {
        row=await this.record(id,c,m,true);
        if(row.version!==dto.version) throw new ConflictException('This record changed; reload before saving');
        if(!['draft','new'].includes(row.status)) throw new BadRequestException('Only a draft can be edited. Create a revision for approved content.');
        if(row.kind==='project') throw new BadRequestException('Project baselines are immutable');
        if(row.predecessor_id&&row.owner_id!==dto.owner_id)throw new BadRequestException('Keep the same owner across document revisions');
        if(row.source_id && (row.customer_id!==dto.customer_id||row.currency!==dto.currency)) throw new BadRequestException('Customer and currency must match the source document');
      } else {
        const newId=randomUUID();const number=await this.number(dto.kind,c,m);
        [row]=await m.query(`INSERT INTO sales_records(id,company_id,kind,number,family_id,customer_id,owner_id,created_by,title,currency,currency_precision) VALUES($1,$2,$3,$4,$1,$5,$6,$7,$8,$9,$10) RETURNING *`,[newId,c.companyId,dto.kind,number,dto.customer_id,dto.owner_id,c.userId,dto.title,dto.currency,precision]);
      }
      const args=[row.id,dto.customer_id,dto.site_id||null,dto.branch_id||null,dto.owner_id,dto.currency,precision,JSON.stringify(dto.requirements),...fields.map(f=>(dto as unknown as Row)[f]||(['valid_until','start_date','delivery_date'].includes(f)?null:''))];
      await m.query(`UPDATE sales_records SET customer_id=$2,site_id=$3,branch_id=$4,owner_id=$5,currency=$6,currency_precision=$7,requirements=$8,${fields.map((f,i)=>`${f}=$${i+9}`).join(',')},version=version+1,updated_at=now() WHERE id=$1`,args);
      const totals=await this.content(m,row,dto,precision);
      await m.query('UPDATE sales_records SET authored_by=$2 WHERE id=$1',[row.id,c.userId]);
      await this.event(m,row,c,id?'update':'create','',{...dto,...totals});
      return this.detailIn(m,row.id,c);
    });
  }

  private filter(c:Context,q:SalesQueryDto,dateColumn='r.document_date') {
    if(q.from&&q.to&&q.from>q.to)throw new BadRequestException('From date must not follow To date');
    const values:unknown[]=[c.companyId,c.userId,c.scope];const clauses=[`r.company_id=$1`,`($3='all' OR r.owner_id=$2 OR r.created_by=$2)`];
    for(const f of ['kind','status','customer_id','owner_id','branch_id']) if((q as Row)[f]) {values.push((q as Row)[f]);clauses.push(`r.${f}=$${values.length}`);}
    if(q.search){values.push('%'+q.search+'%');clauses.push(`(r.number ILIKE $${values.length} OR r.title ILIKE $${values.length} OR r.customer_po ILIKE $${values.length} OR c.name ILIKE $${values.length})`);}
    if(q.from){values.push(q.from);clauses.push(`${dateColumn} >= $${values.length}::date`);}if(q.to){values.push(q.to);clauses.push(`${dateColumn} <= $${values.length}::date`);}
    if(q.department_id){values.push(q.department_id);clauses.push(`u.department_id=$${values.length}`);}
    if(q.project_id){values.push(q.project_id);clauses.push(`r.id IN (WITH RECURSIVE chain AS (SELECT id,source_id FROM sales_records WHERE id=$${values.length} AND company_id=$1 UNION ALL SELECT s.id,s.source_id FROM sales_records s JOIN chain ON chain.source_id=s.id) SELECT id FROM chain)`);}
    return {values,where:clauses.join(' AND ')};
  }
  async list(query:SalesQueryDto,actor:SalesActor) {
    const c=await this.context(actor);const {where,values}=this.filter(c,query);
    const join=`FROM sales_records r JOIN customers c ON c.id=r.customer_id JOIN users u ON u.id=r.owner_id WHERE ${where} AND (r.is_current OR r.status IN ('draft','review'))`;
    const [{total}]=await this.db.query(`SELECT count(*)::int AS total ${join}`,values);
    const data=await this.db.query(`SELECT r.*,c.name AS customer_name,u.first_name||' '||u.last_name AS owner_name ${join} ORDER BY r.updated_at DESC LIMIT $${values.length+1} OFFSET $${values.length+2}`,[...values,query.limit||30,query.offset||0]);
    return {data,total};
  }
  private async detailIn(m:EntityManager,id:string,c:Context):Promise<Row> {
    const row=await this.record(id,c,m);
    // A transaction manager owns one connection; execute its reads in order.
    const lines=await m.query(`SELECT * FROM sales_lines WHERE record_id=$1 ORDER BY position`,[id]);
    const milestones=await m.query(`SELECT * FROM sales_milestones WHERE record_id=$1 ORDER BY position`,[id]);
    const events=await m.query(`SELECT e.*,u.first_name||' '||u.last_name AS actor_name FROM sales_events e JOIN users u ON u.id=e.actor_id WHERE e.record_id IN (SELECT id FROM sales_records WHERE family_id=$1) ORDER BY e.created_at DESC`,[row.family_id]);
    const attachments=await m.query(`SELECT id,record_id,name,mime,created_at,actor_id FROM sales_attachments WHERE record_id IN (SELECT id FROM sales_records WHERE family_id=$1) ORDER BY created_at DESC`,[row.family_id]);
    const revisions=await m.query(`SELECT id,revision,status,is_current,created_at FROM sales_records WHERE family_id=$1 ORDER BY revision DESC`,[row.family_id]);
    const downstream=await m.query(`SELECT id,kind,number,revision,status FROM sales_records WHERE source_id IN (SELECT id FROM sales_records WHERE family_id=$1) AND is_current AND (owner_id=$2 OR created_by=$2 OR $3='all')`,[row.family_id,c.userId,c.scope]);
    let source=null;if(row.source_id){try{const s=await this.record(row.source_id,c,m);source={id:s.id,number:s.number,kind:s.kind,revision:s.revision,status:s.status};}catch(e){if(!(e instanceof NotFoundException))throw e;}}
    const [customer]=await m.query(`SELECT name FROM customers WHERE id=$1`,[row.customer_id]);
    return {...row,customer_name:customer?.name,lines,milestones,events,attachments,revisions,source,downstream};
  }
  async detail(id:string,actor:SalesActor){return this.detailIn(this.db.manager,id,await this.context(actor));}

  async assertProjectAccess(runtimeId:string,actor:SalesActor) {
    const [record]=await this.db.query(`SELECT id FROM sales_records WHERE runtime_id=$1 AND is_current`,[runtimeId]);
    if(record) await this.record(record.id,await this.context(actor));
  }
  async print(id:string,actor:SalesActor) {
    return this.db.transaction(async m=>{const c=await this.context(actor,'export',m),r=await this.record(id,c,m);await this.event(m,r,c,'export','Print/PDF');return this.detailIn(m,id,c);});
  }

  private async ready(row:Row,c:Context,m:EntityManager) {
    const refs=await this.references(row,{...c,scope:'all'},m);
    for(const f of ['site_id','machine_category','delivery_date']) if(!row[f]) throw new BadRequestException(`${f.replace(/_/g,' ')} is required`);
    const date=(x:any)=>String(x instanceof Date?x.toISOString():x).slice(0,10);
    if(date(row.delivery_date)<date(row.document_date)||row.start_date&&date(row.delivery_date)<date(row.start_date)) throw new BadRequestException('Delivery must not precede document/start date');
    if(Object.values(row.requirements||{}).length<7||Object.values(row.requirements).some(v=>typeof v!=='string'||!v.trim())) throw new BadRequestException('Complete all seven requirement summaries; use Not applicable where appropriate');
    if(row.kind!=='enquiry') {
      if(!row.scope.trim()||!row.exclusions.trim()||!row.warranty.trim()||!row.terms.trim()) throw new BadRequestException('Complete scope, exclusions, warranty and commercial terms');
      if(!row.valid_until||date(row.valid_until)<date(row.document_date)) throw new BadRequestException('Set valid quotation dates');
      const lines=await m.query(`SELECT * FROM sales_lines WHERE record_id=$1`,[row.id]);
      if(!lines.length||Number(row.gross)<=0) throw new BadRequestException('At least one priced line and a positive total are required');
      for(const l of lines){if(l.item_id)await this.master('items',l.item_id,m);if(l.uom_id)await this.master('uoms',l.uom_id,m);}
      const milestones=await m.query(`SELECT amount FROM sales_milestones WHERE record_id=$1`,[row.id]);
      if(!milestones.length||milestones.reduce((sum:bigint,p:Row)=>sum+amountUnits(p.amount,row.currency_precision),0n)!==amountUnits(row.gross,row.currency_precision)) throw new BadRequestException('Payment milestones must equal the gross contract value');
    }
    const [company]=await m.query(`SELECT name,code,address,base_currency,timezone,tax_registration_number FROM companies WHERE id=$1`,[c.companyId]);
    return {company,customer:{id:refs.customer.id,name:refs.customer.name,code:refs.customer.code,address:refs.customer.address,contact:refs.customer.contact_person,tax:refs.customer.vat_number},site:refs.site};
  }
  private async copy(m:EntityManager,row:Row,c:Context,kind:string,revision=false,cmd?:SalesCommandDto):Promise<Row> {
    const id=randomUUID();const [{next}]=await m.query(`SELECT COALESCE(max(revision),0)+1 AS next FROM sales_records WHERE family_id=$1`,[row.family_id]);
    const number=revision?row.number:await this.number(kind,c,m);
    const [created]=await m.query(`INSERT INTO sales_records(id,company_id,kind,number,family_id,revision,is_current,source_id,predecessor_id,customer_id,site_id,branch_id,owner_id,created_by,title,machine_category,quantity,document_date,valid_until,start_date,delivery_date,currency,currency_precision,net,tax,gross,scope,exclusions,warranty,terms,customer_po,inquiry_source,requirements,snapshot)
      SELECT $1,company_id,$2,$3,$4,$5,$6,$7,$8,customer_id,site_id,branch_id,owner_id,created_by,title,machine_category,quantity,document_date,valid_until,start_date,delivery_date,currency,currency_precision,net,tax,gross,scope,exclusions,warranty,terms,customer_po,inquiry_source,requirements,snapshot FROM sales_records WHERE id=$9 RETURNING *`,[id,kind,number,revision?row.family_id:id,revision?Number(next):1,!revision,revision?row.source_id:row.id,revision?row.id:null,row.id]);
    await m.query(`INSERT INTO sales_lines(record_id,line_key,source_line_id,item_id,uom_id,description,unit,quantity,unit_price,discount_percent,tax_percent,net,tax,gross,position) SELECT $1,line_key,id,item_id,uom_id,description,unit,quantity,unit_price,discount_percent,tax_percent,net,tax,gross,position FROM sales_lines WHERE record_id=$2`,[id,row.id]);
    await m.query(`INSERT INTO sales_milestones(record_id,label,trigger,due_date,amount,position) SELECT $1,label,trigger,due_date,amount,position FROM sales_milestones WHERE record_id=$2`,[id,row.id]);
    if(cmd?.customer_po)await m.query(`UPDATE sales_records SET customer_po=$2 WHERE id=$1`,[id,cmd.customer_po]);
    await m.query('UPDATE sales_records SET authored_by=$2 WHERE id=$1',[id,c.userId]);
    await this.event(m,created,c,revision?'revision_created':'converted','',{sourceId:row.id});
    return created;
  }
  async command(id:string,dto:SalesCommandDto,actor:SalesActor) {
    const actionPermission=['approve','return','reject'].includes(dto.action)?'approve':dto.action==='cancel'?'cancel':['quote','order','project','revise'].includes(dto.action)?'create':'edit';
    return this.db.transaction(async m=>{
      const c=await this.context(actor,actionPermission,m);
      const hash=createHash('sha256').update(JSON.stringify({id,...dto})).digest('hex');
      await m.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[c.userId+dto.request_key]);
      const [request]=await m.query(`SELECT * FROM sales_requests WHERE actor_id=$1 AND key=$2`,[c.userId,dto.request_key]);
      if(request){if(request.hash!==hash)throw new ConflictException('This request key was already used with different data');return this.detailIn(m,request.result_id,c);}
      let row=await this.record(id,c,m);
      await m.query(`SELECT pg_advisory_xact_lock(hashtextextended($1,0))`,[row.family_id]);
      row=await this.record(id,c,m,true);
      if(row.version!==dto.version)throw new ConflictException('This record changed; reload before continuing');
      const config=await this.settings(c.companyId,m);
      if(row.kind==='order'&&['submit','approve'].includes(dto.action)) {
        const [source]=await m.query(`SELECT status,is_current,approval FROM sales_records WHERE id=$1 FOR SHARE`,[row.source_id]);
        if(!source||source.status!=='accepted'||!source.is_current||source.approval!=='approved')throw new BadRequestException('The source quotation must still be the current accepted revision');
      }
      const reason=dto.reason?.trim()||'';
      if(['return','reject','customer_reject','lose','reopen','hold','resume','cancel','revise'].includes(dto.action)&&!reason) throw new BadRequestException('A reason is required');
      let resultId=id,nextStatus=row.status,approval=row.approval;
      const requireState=(kind:string|string[],states:string[])=>{if(!(Array.isArray(kind)?kind:[kind]).includes(row.kind)||!states.includes(row.status))throw new BadRequestException(`Cannot ${dto.action} this ${row.kind} in ${row.status}`);};
      if(dto.action==='qualify') {requireState('enquiry',['draft','new']);await this.ready(row,c,m);nextStatus='qualified';}
      else if(dto.action==='lose'){requireState('enquiry',['new','qualified','quoted']);nextStatus='lost';}
      else if(dto.action==='reopen'){requireState('enquiry',['lost']);nextStatus='new';}
      else if(dto.action==='submit'){requireState(['quote','order'],['draft']);await this.ready(row,c,m);if(row.kind==='order'&&!row.customer_po.trim())throw new BadRequestException('Customer PO reference is required');nextStatus='review';approval='pending';}
      else if(dto.action==='return'||dto.action==='reject') {requireState(['quote','order'],['review']);nextStatus=dto.action==='return'?'draft':row.kind==='quote'?'rejected':'draft';approval=dto.action==='return'?'returned':'rejected';}
      else if(dto.action==='customer_reject') {requireState('quote',['sent']);nextStatus='rejected';}
      else if(dto.action==='approve') {
        requireState(['quote','order'],['review']);
        if(config.separate_approver&&[row.created_by,row.owner_id,row.authored_by].includes(c.userId))throw new ForbiddenException('A different authorized person must approve this document');
        const snapshot=await this.ready(row,c,m);
        const [downstream]=await m.query(`SELECT target_family FROM sales_conversions WHERE source_family=$1`,[row.family_id]);
        if(row.kind==='order'&&downstream)throw new BadRequestException('This order has a project baseline. Resolve its change impact before an amendment can be approved.');
        await m.query(`UPDATE sales_records SET status='superseded',is_current=false,superseded_by=$2,version=version+1 WHERE family_id=$1 AND id<>$2 AND is_current AND status NOT IN ('draft','review')`,[row.family_id,id]);
        await m.query(`UPDATE sales_records SET is_current=true,approved_by=$2,approved_at=now(),snapshot=$3,confirmed_at=CASE WHEN kind='order' THEN now() ELSE NULL END WHERE id=$1`,[id,c.userId,JSON.stringify(snapshot)]);
        approval='approved';nextStatus=row.kind==='quote'?'approved':'confirmed';
        if(row.kind==='order') await m.query(`UPDATE sales_records SET status='won',version=version+1 WHERE id IN (SELECT source_id FROM sales_records WHERE id=$1) AND kind='enquiry'`,[row.source_id]);
      }
      else if(dto.action==='send'){requireState('quote',['approved']);await this.ready(row,c,m);nextStatus='sent';await m.query(`UPDATE sales_records SET sent_at=now() WHERE id=$1`,[id]);}
      else if(dto.action==='accept') {
        requireState('quote',['sent']);if(!dto.evidence?.trim())throw new BadRequestException('Record the customer acceptance reference/evidence');
        const [{expired}]=await m.query(`SELECT valid_until < (now() AT TIME ZONE c.timezone)::date AS expired FROM sales_records r JOIN companies c ON c.id=r.company_id WHERE r.id=$1`,[id]);
        if(expired)throw new BadRequestException('Quotation validity has expired. Issue a new revision.');
        nextStatus='accepted';await m.query(`UPDATE sales_records SET accepted_evidence=$2,accepted_at=now(),customer_po=$3 WHERE id=$1`,[id,dto.evidence,dto.customer_po||row.customer_po]);
      }
      else if(dto.action==='expire'){requireState('quote',['sent']);const [{expired}]=await m.query(`SELECT valid_until < (now() AT TIME ZONE c.timezone)::date AS expired FROM sales_records r JOIN companies c ON c.id=r.company_id WHERE r.id=$1`,[id]);if(!expired)throw new BadRequestException('This quotation has not expired');nextStatus='expired';}
      else if(['quote','order','project','revise'].includes(dto.action)) {
        if(dto.action==='revise')requireState(['quote','order'],row.kind==='quote'?['approved','sent','accepted','rejected','expired']:['confirmed','on_hold']);
        if(dto.action==='quote')requireState('enquiry',['qualified','quoted']);
        if(dto.action==='order')requireState('quote',['accepted']);
        if(dto.action==='project')requireState('order',['confirmed']);
        if(dto.action!=='revise'&&!row.is_current)throw new BadRequestException('Only the current approved source can be converted');
        if(['order','project'].includes(dto.action)) {
          if(row.approval!=='approved')throw new BadRequestException('Source approval is required');
          await this.ready(row,c,m);
          const [existing]=await m.query(`SELECT target_family FROM sales_conversions WHERE source_family=$1`,[row.family_id]);
          if(existing)throw new ConflictException('This source has already been converted');
        }
        if(dto.action==='revise'&&row.kind==='order'&&(await m.query(`SELECT 1 FROM sales_conversions WHERE source_family=$1`,[row.family_id])).length)throw new BadRequestException('Order has a project baseline; resolve project change impact before revising');
        const created=await this.copy(m,row,c,dto.action==='revise'?row.kind:dto.action,dto.action==='revise',dto);resultId=created.id;
        if(['order','project'].includes(dto.action))await m.query(`INSERT INTO sales_conversions(source_family,target_family) VALUES($1,$2)`,[row.family_id,created.family_id]);
        if(dto.action==='quote')nextStatus='quoted';
        if(dto.action==='project') {
          if(!dto.owner_id||!dto.start_date||!dto.delivery_date||!dto.title?.trim())throw new BadRequestException('Project name, owner, start and delivery dates are required');
          const owner=await this.master('users',dto.owner_id,m);if(!['admin','manager'].includes(owner.role))throw new BadRequestException('Select a project manager or administrator');
          if(dto.delivery_date<dto.start_date)throw new BadRequestException('Project delivery cannot precede start');
          const runtimeId=randomUUID();
          const baseline={sourceOrderId:row.id,sourceOrderNumber:row.number,sourceQuoteId:row.source_id,site:row.snapshot.site,scope:row.scope,requirements:row.requirements,currency:row.currency,net:row.net,tax:row.tax,grandTotal:row.gross,paymentMilestones:await m.query(`SELECT label,trigger,due_date,amount FROM sales_milestones WHERE record_id=$1`,[row.id])};
          await m.query(`INSERT INTO runtime_documents(id,domain,data) VALUES($1,'Project',$2)`,[runtimeId,JSON.stringify({projectNo:created.number,name:dto.title,customerId:row.customer_id,projectManagerId:dto.owner_id,startDate:dto.start_date,targetDeliveryDate:dto.delivery_date,stage:'inquiry',health:'healthy',priority:'medium',teamMembers:[],milestones:[],attachments:[],salesRecordId:created.id,commercialSnapshot:baseline,lifecycleStatus:'initiated'})]);
          await m.query(`UPDATE sales_records SET status='initiated',approval='approved',owner_id=$2,title=$3,start_date=$4,delivery_date=$5,runtime_id=$6,runtime_domain='Project',snapshot=$7 WHERE id=$1`,[created.id,dto.owner_id,dto.title,dto.start_date,dto.delivery_date,runtimeId,JSON.stringify({...row.snapshot,baseline})]);
        }
      }
      else if(dto.action==='hold'){requireState(['order','project'],['confirmed','initiated','active']);nextStatus='on_hold';}
      else if(dto.action==='resume'){requireState(['order','project'],['on_hold']);nextStatus=row.kind==='order'?'confirmed':'active';}
      else if(dto.action==='activate'){requireState('project',['initiated']);nextStatus='active';}
      else if(dto.action==='cancel') {
        if(terminal.includes(row.status))throw new BadRequestException('This record is already terminal');
        const downstream=await m.query(`SELECT r.status FROM sales_conversions x JOIN sales_records r ON r.family_id=x.target_family WHERE x.source_family=$1 AND r.is_current AND r.status NOT IN ('cancelled','closed')`,[row.family_id]);
        if(downstream.length)throw new BadRequestException('Resolve or cancel the downstream order/project first');
        nextStatus='cancelled';
      } else throw new BadRequestException('Unsupported action');
      await m.query(`UPDATE sales_records SET status=$2,approval=$3,version=version+1,updated_at=now() WHERE id=$1`,[id,nextStatus,approval]);
      if(row.runtime_id)await m.query(`UPDATE runtime_documents SET data=jsonb_set(data,'{lifecycleStatus}',to_jsonb($2::text)),updated_at=now() WHERE id=$1 AND domain='Project'`,[row.runtime_id,nextStatus]);
      await this.event(m,row,c,dto.action,reason,{from:row.status,to:nextStatus,resultId});
      await m.query(`INSERT INTO sales_requests(actor_id,key,hash,result_id) VALUES($1,$2,$3,$4)`,[c.userId,dto.request_key,hash,resultId]);
      return this.detailIn(m,resultId,c);
    });
  }

  async comment(id:string,type:string,text:string,actor:SalesActor) {
    return this.db.transaction(async m=>{const c=await this.context(actor,'edit',m),r=await this.record(id,c,m);await this.event(m,r,c,type,text);return {ok:true};});
  }
  async attach(id:string,file:{buffer:Buffer;originalname:string;mimetype:string},actor:SalesActor) {
    if(!file||file.buffer.length>8*1024*1024)throw new BadRequestException('Choose a file up to 8 MB');
    const b=file.buffer;const mime=b.subarray(0,5).toString()==='%PDF-'?'application/pdf':b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':null;
    if(!mime)throw new BadRequestException('Supported evidence: PDF, PNG or JPEG');
    return this.db.transaction(async m=>{const c=await this.context(actor,'edit',m),r=await this.record(id,c,m);
      const [attachment]=await m.query(`INSERT INTO sales_attachments(record_id,actor_id,name,mime,content) VALUES($1,$2,$3,$4,$5) RETURNING id,name`,[id,c.userId,file.originalname.replace(/[^\w. -]/g,'_').slice(0,200),mime,b]);
      await this.event(m,r,c,'attachment_added',attachment.name,{attachmentId:attachment.id});return attachment;
    });
  }
  async download(id:string,attachmentId:string,actor:SalesActor){const c=await this.context(actor);await this.record(id,c);const [file]=await this.db.query(`SELECT * FROM sales_attachments WHERE id=$1 AND record_id=$2`,[attachmentId,id]);if(!file)throw new NotFoundException('Attachment not found');return file;}
  async compare(id:string,other:string,actor:SalesActor) {
    const c=await this.context(actor),a=await this.detailIn(this.db.manager,id,c),b=await this.detailIn(this.db.manager,other,c);
    if(a.family_id!==b.family_id)throw new BadRequestException('Compare revisions of the same document');
    for(const record of [a,b])record.milestones=record.milestones.map((p:Row)=>({label:p.label,trigger:p.trigger,due_date:p.due_date,amount:p.amount}));
    const map=(rows:Row[])=>new Map(rows.map(l=>[l.line_key,l]));const al=map(a.lines),bl=map(b.lines);
    const lineFields=['description','unit','item_id','uom_id','quantity','unit_price','discount_percent','tax_percent'];
    return {from:a.revision,to:b.revision,fields:[...fields,'requirements','currency','net','tax','gross','milestones'].filter(f=>JSON.stringify(a[f])!==JSON.stringify(b[f])).map(f=>({field:f,before:a[f],after:b[f]})),added:b.lines.filter((l:Row)=>!al.has(l.line_key)),removed:a.lines.filter((l:Row)=>!bl.has(l.line_key)),changed:b.lines.filter((l:Row)=>al.has(l.line_key)&&lineFields.some(f=>String(al.get(l.line_key)![f])!==String(l[f]))).map((l:Row)=>({before:al.get(l.line_key),after:l}))};
  }
  /**
   * Cross-release dashboard feed: where commercial work stands, and what is
   * waiting on somebody.
   *
   * Scope and permissions come from the same context() the record routes use,
   * so a user with 'own' scope sees only their own pipeline. Money is grouped
   * by currency and summed in scaled integer units — totals from different
   * currencies are never added together.
   */
  async overview(actor:SalesActor) {
    const c=await this.context(actor);
    const open:Record<string,string[]>={
      enquiry:['draft','new','qualified','quoted'],
      quote:['draft','review','approved','sent'],
      order:['draft','review','confirmed','on_hold','partially_delivered'],
      project:['draft','initiated','active','on_hold'],
    };
    const visible=`r.company_id=$1 AND ($3='all' OR r.owner_id=$2 OR r.created_by=$2)`;
    const values=[c.companyId,c.userId,c.scope];
    const rows:Row[]=await this.db.query(
      `SELECT r.kind,r.status,r.currency,r.currency_precision,r.net,r.tax,r.gross,r.id,r.number,r.title,r.approval,
              r.valid_until,r.delivery_date,c.name AS customer_name,u.first_name||' '||u.last_name AS owner_name
         FROM sales_records r JOIN customers c ON c.id=r.customer_id JOIN users u ON u.id=r.owner_id
        WHERE ${visible} AND r.is_current`, values);

    const stages=Object.entries(open).map(([kind,statuses])=>{
      const live=rows.filter(r=>r.kind===kind&&statuses.includes(r.status));
      const byCurrency=new Map<string,{units:bigint;precision:number}>();
      for(const r of live) {
        const entry=byCurrency.get(r.currency)||{units:0n,precision:r.currency_precision};
        entry.precision=Math.max(entry.precision,r.currency_precision);
        entry.units+=amountUnits(r.gross,4);
        byCurrency.set(r.currency,entry);
      }
      return {
        kind, open:live.length, total:rows.filter(r=>r.kind===kind).length,
        value:[...byCurrency.entries()].map(([currency,entry])=>{
          const scale=10n**BigInt(4-entry.precision);
          return {currency,gross:moneyString(entry.units/scale,entry.precision)};
        }),
      };
    });

    const brief=(r:Row)=>({id:r.id,kind:r.kind,number:r.number,title:r.title,status:r.status,
      customer:r.customer_name,owner:r.owner_name,currency:r.currency,gross:r.gross,
      valid_until:r.valid_until,delivery_date:r.delivery_date});
    const today=new Date().toISOString().slice(0,10);
    const soon=new Date(Date.now()+14*86400000).toISOString().slice(0,10);
    const day=(value:unknown)=>value?String(value).slice(0,10):null;

    return {
      scope:c.scope, stages,
      attention:{
        pendingApproval:rows.filter(r=>r.approval==='pending'&&['review'].includes(r.status)).map(brief),
        expiringQuotes:rows.filter(r=>r.kind==='quote'&&['sent','approved'].includes(r.status)
          &&day(r.valid_until)&&day(r.valid_until)!<=soon).map(brief),
        overdueOrders:rows.filter(r=>r.kind==='order'&&open.order.includes(r.status)
          &&day(r.delivery_date)&&day(r.delivery_date)!<today).map(brief),
      },
    };
  }

  async notifications(actor:SalesActor) {
    const c=await this.context(actor);return this.db.query(`SELECT n.* FROM sales_notifications n JOIN sales_records r ON r.id=n.record_id WHERE n.user_id=$1 AND r.company_id=$2 AND ($3='all' OR r.owner_id=$1 OR r.created_by=$1) ORDER BY n.created_at DESC LIMIT 100`,[c.userId,c.companyId,c.scope]);
  }
  async readNotification(id:string,actor:SalesActor){await this.context(actor);await this.db.query(`UPDATE sales_notifications SET read_at=now() WHERE id=$1 AND user_id=$2`,[id,actor.userId]);return {ok:true};}
  async reminders() {
    await this.db.query(`INSERT INTO sales_notifications(user_id,record_id,message,event_key)
      SELECT DISTINCT u.id,r.id,r.number||': quotation expiry / payment milestone approaching',r.id::text||':'||(now() AT TIME ZONE c.timezone)::date::text
      FROM sales_records r JOIN companies c ON c.id=r.company_id JOIN sales_access a ON a.company_id=r.company_id JOIN users u ON u.id=a.user_id
      WHERE r.is_current AND u.is_active AND u.deleted_at IS NULL AND (a.scope='all' OR u.id=r.owner_id OR u.id=r.created_by)
      AND EXISTS(SELECT 1 FROM role_permissions rp JOIN roles rr ON rr.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE rr.key=u.role AND rr.is_active AND rr.deleted_at IS NULL AND rp.allowed AND p.code='sales.view' AND p.is_active AND p.deleted_at IS NULL)
      AND ((r.kind='quote' AND r.status='sent' AND r.valid_until<=(now() AT TIME ZONE c.timezone)::date+3)
      OR (r.kind='order' AND r.status='confirmed' AND EXISTS(SELECT 1 FROM sales_milestones sm WHERE sm.record_id=r.id AND sm.due_date BETWEEN (now() AT TIME ZONE c.timezone)::date AND (now() AT TIME ZONE c.timezone)::date+7)))
      ON CONFLICT DO NOTHING`);
  }

  async report(name:string,query:SalesQueryDto,actor:SalesActor,exporting=false) {
    const c=await this.context(actor,exporting?'export':'view');
    const definitions:Record<string,string>={pipeline:'Enquiry counts by commercial stage; amounts are contractual estimates, not revenue.',conversion:'Quote families ever accepted / first-issued quote families in the selected first-issue date cohort. Revisions count once; as-of now.',quotations:'Current quotations by customer, currency and decision. Superseded revisions are excluded.',orders:'Confirmed order intake by confirmation month and customer; net, tax and gross are kept separate by currency. Cancelled orders are excluded.',pending:'Confirmed and on-hold orders with outstanding commercial scope. Delivery quantities are introduced in R8.',milestones:'Agreed gross-value milestone schedule. These are contractual amounts, not invoices or payment receipts.',intake:'Machine projects initiated with approved-order source references.'};
    if(!definitions[name])throw new NotFoundException('Report not found');
    const kind=['pipeline'].includes(name)?'enquiry':['conversion','quotations'].includes(name)?'quote':['intake'].includes(name)?'project':'order';
    const cohort=name==='conversion'?'h.first_issued':name==='orders'?'h.first_confirmed':null;
    const {where,values}=this.filter(c,{...query,kind},cohort?`(${cohort} AT TIME ZONE org.timezone)::date`:'r.document_date');
    const records:Row[]=await this.db.query(`SELECT r.*,c.name AS customer_name,u.first_name||' '||u.last_name AS owner_name,h.first_issued,h.was_accepted,to_char(h.first_confirmed AT TIME ZONE org.timezone,'YYYY-MM') AS confirmation_month FROM sales_records r JOIN customers c ON c.id=r.customer_id JOIN users u ON u.id=r.owner_id JOIN companies org ON org.id=r.company_id CROSS JOIN LATERAL (SELECT min(sent_at) AS first_issued,min(confirmed_at) AS first_confirmed,bool_or(accepted_at IS NOT NULL) AS was_accepted FROM sales_records history WHERE history.family_id=r.family_id) h WHERE ${where} AND r.is_current ORDER BY r.document_date DESC`,values);
    let rows:Row[]=records.map(r=>({id:r.id,number:r.number,revision:r.revision,status:r.status,customer:r.customer_name,owner:r.owner_name,date:r.document_date,delivery_date:r.delivery_date,currency:r.currency,net:r.net,tax:r.tax,gross:r.gross,source_id:r.source_id}));
    if(name==='pipeline')rows=['draft','new','qualified','quoted','won','lost','cancelled'].map(status=>({status,count:records.filter(r=>r.status===status).length}));
    if(name==='conversion') {
      const issued=records.filter(r=>r.first_issued);const accepted=issued.filter(r=>r.was_accepted);
      rows=[{issued:issued.length,accepted:accepted.length,conversion_percent:issued.length?Math.round(accepted.length/issued.length*10000)/100:null}];
    }
    if(name==='orders') {
      const groups=new Map<string,Row>();for(const r of records.filter(r=>r.confirmed_at&&r.status!=='cancelled')) {
        const month=r.confirmation_month,key=[month,r.customer_id,r.currency].join(':');let g=groups.get(key);
        if(!g){g={month,customer:r.customer_name,currency:r.currency,count:0,netUnits:0n,taxUnits:0n,precision:r.currency_precision};groups.set(key,g);}
        g.precision=Math.max(g.precision,r.currency_precision);g.count++;g.netUnits+=amountUnits(r.net,4);g.taxUnits+=amountUnits(r.tax,4);
      }
      rows=[...groups.values()].map(g=>{const scale=10n**BigInt(4-g.precision);return {month:g.month,customer:g.customer,currency:g.currency,count:g.count,net:moneyString(g.netUnits/scale,g.precision),tax:moneyString(g.taxUnits/scale,g.precision),gross:moneyString((g.netUnits+g.taxUnits)/scale,g.precision)};});
    }
    if(name==='pending')rows=rows.filter(r=>['confirmed','on_hold'].includes(r.status));
    if(name==='milestones') {
      const ids=records.filter(r=>['confirmed','on_hold'].includes(r.status)).map(r=>r.id);
      rows=ids.length?await this.db.query(`SELECT m.id,m.record_id AS id,r.number,r.currency,m.label,m.trigger,m.due_date,m.amount FROM sales_milestones m JOIN sales_records r ON r.id=m.record_id WHERE m.record_id=ANY($1::uuid[]) ORDER BY m.due_date NULLS LAST,m.position`,[ids]):[];
    }
    const result={name,definition:definitions[name],filters:query,generated_at:new Date().toISOString(),generated_by:c.userId,rows,sources:records.map(r=>({id:r.id,number:r.number,customer:r.customer_name,status:r.status}))};
    if(exporting)await this.db.query(`INSERT INTO audit_logs(action,entity_type,entity_id,performed_by,new_values) VALUES('export','SalesReport',$1,$2,$3)`,[c.companyId,c.userId,JSON.stringify({name,filters:query,rowCount:rows.length})]);
    return result;
  }
}
