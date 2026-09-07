import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { postgresOptions } from '../../database/database.config';
import { SalesService } from './sales.service';
import { SalesDocumentDto } from './sales.dto';

// Isolate in a fresh schema. Never drop or reset the Release 1/public database.
const url=process.env.R2_TEST_DATABASE_URL;
const schema=process.env.R2_TEST_SCHEMA;
if(!url||!schema||!/^machineiq_r2_test_\d+$/.test(schema))throw new Error('Set R2_TEST_DATABASE_URL and a machineiq_r2_test_<digits> schema');
describe('R2 PostgreSQL acceptance',()=>{
  let db:DataSource,sales:SalesService,admin:any,manager:any,seller:any,outsider:any,customer:string,site:string,company:string,quote:any,order:any;
  const command=async(record:any,action:string,actor:any,extra:any={})=>sales.command(record.id,{action,version:record.version,request_key:randomUUID(),...extra},actor);
  let base:SalesDocumentDto;
  beforeAll(async()=>{
    const setup=new DataSource({type:'postgres',url});await setup.initialize();
    await setup.query(`CREATE SCHEMA "${schema}"`);await setup.destroy();
    db=new DataSource({...postgresOptions(url) as any,schema,extra:{options:`-c search_path=${schema}`},migrationsRun:false,retryAttempts:0,entities:[]});await db.initialize();await db.runMigrations({transaction:'all'});
    // Revert/reapply R2 before data is posted to verify its empty-schema recovery.
    await db.undoLastMigration({transaction:'all'});await db.runMigrations({transaction:'all'});
    [company]=(await db.query(`INSERT INTO companies(code,name) VALUES('R2','R2 Test Organization') RETURNING id`)).map((r:any)=>r.id);
    const actor=async(role:string,email:string)=>{const [u]=await db.query(`INSERT INTO users(first_name,last_name,email,password_hash,role) VALUES('R2',$1::text,$2,'not-used',$1::text::users_role_enum) RETURNING id`,[role,email]);return {userId:u.id,role};};
    admin=await actor('admin','admin-r2@test.local');manager=await actor('manager','manager-r2@test.local');seller=await actor('sales','seller-r2@test.local');outsider=await actor('sales','outsider-r2@test.local');
    [customer]=(await db.query(`INSERT INTO customers(code,name) VALUES('R2-C','R2 Customer') RETURNING id`)).map((r:any)=>r.id);
    sales=new SalesService(db);site=(await sales.createSite({customer_id:customer,name:'Factory',address:'Site address',contact:'Customer'},seller)).id;
    await sales.config(admin);await sales.config(manager);await sales.config(outsider);
    base={kind:'enquiry',customer_id:customer,site_id:site,owner_id:seller.userId,title:'Leak test machine',machine_category:'Testing',quantity:1,document_date:'2026-09-07',valid_until:'2099-12-31',delivery_date:'2099-12-31',currency:'INR',scope:'Machine and installation',exclusions:'Civil works',warranty:'12 months',terms:'Agreed milestones',customer_po:'PO-101',inquiry_source:'RFQ',requirements:{intended_use:'Leak test',performance:'10 per minute',interfaces:'Ethernet',utilities:'230V',constraints:'Indoor',standards:'Customer standard',customer_items:'Test parts'},lines:[{description:'Machine',unit:'Nos',quantity:1,unit_price:100,discount_percent:0,tax_percent:18}],milestones:[{label:'Order',trigger:'Order confirmation',amount:118}]};
  },60000);
  afterAll(async()=>{if(db?.isInitialized)await db.destroy();});
  it('validates exact customer/site and returns permissioned config',async()=>{
    expect((await sales.config(seller)).company.id).toBe(company);
    await expect(sales.save({...base,site_id:randomUUID()},seller)).rejects.toThrow('site');
    const enquiry=await sales.save(base,seller);await expect(sales.detail(enquiry.id,outsider)).rejects.toThrow('not found');
    const qualified=await command(enquiry,'qualify',seller);quote=await command(qualified,'quote',seller);expect(quote.lines[0].gross).toBe('118.0000');
  });
  it('requires independent approval and customer acceptance',async()=>{
    quote=await command(quote,'submit',seller);await expect(command(quote,'approve',seller)).rejects.toThrow();
    quote=await command(quote,'approve',manager);expect(quote.status).toBe('approved');
    await expect(sales.save({...base,kind:'quote',version:quote.version},seller,quote.id)).rejects.toThrow('revision');
    await expect(db.query(`UPDATE sales_lines SET quantity=9 WHERE record_id=$1`,[quote.id])).rejects.toThrow('immutable');
    quote=await command(quote,'send',seller);await expect(command(quote,'accept',seller)).rejects.toThrow('evidence');
    quote=await command(quote,'accept',seller,{evidence:'Signed customer PO-101'});expect(quote.status).toBe('accepted');
  });
  it('converts exactly once under concurrency and replays idempotently',async()=>{
    const dto={action:'order',version:quote.version,request_key:randomUUID()};
    const results=await Promise.all([sales.command(quote.id,dto,seller),sales.command(quote.id,dto,seller)]);
    expect(results[0].id).toBe(results[1].id);order=results[0];
    expect(order.source_id).toBe(quote.id);expect(order.lines[0].source_line_id).toBe(quote.lines[0].id);expect(order.gross).toBe(quote.gross);expect(order.terms).toBe(quote.terms);
    await expect(sales.command(quote.id,{...dto,customer_po:'Changed'},seller)).rejects.toThrow('different data');
    expect((await db.query(`SELECT count(*)::int AS n FROM sales_records WHERE kind='order'`))[0].n).toBe(1);
  });
  it('creates a traceable project from a confirmed order and blocks cancellation with downstream work',async()=>{
    order=await command(order,'submit',seller);order=await command(order,'approve',manager);
    const project=await command(order,'project',manager,{owner_id:manager.userId,title:'Machine project',start_date:'2026-09-08',delivery_date:'2099-12-31'});
    expect(project.status).toBe('initiated');expect(project.snapshot.baseline.sourceOrderId).toBe(order.id);
    const [runtime]=await db.query(`SELECT * FROM runtime_documents WHERE id=$1`,[project.runtime_id]);expect(runtime.domain).toBe('Project');expect(runtime.data.commercialSnapshot.sourceOrderId).toBe(order.id);
    order=await sales.detail(order.id,seller);await expect(command(order,'cancel',manager,{reason:'Cancelled'})).rejects.toThrow('downstream');
    expect((await sales.detail(quote.id,seller)).source.kind).toBe('enquiry');
    await expect(db.query(`DELETE FROM sales_events WHERE record_id=$1`,[order.id])).rejects.toThrow('history');
    expect((await db.query(`SELECT status FROM sales_records WHERE kind='enquiry'`))[0].status).toBe('won');
  });
  it('preserves revisions and reports source totals without duplicating orders',async()=>{
    quote=await sales.detail(quote.id,seller);let revision=await command(quote,'revise',seller,{reason:'Revised delivery terms'});
    expect(revision.revision).toBe(2);expect((await sales.detail(quote.id,seller)).status).toBe('accepted');
    revision=await sales.save({...base,kind:'quote',version:revision.version,terms:'New terms',lines:revision.lines.map((l:any)=>({line_key:l.line_key,description:l.description,unit:l.unit,quantity:1,unit_price:100,discount_percent:0,tax_percent:18}))},seller,revision.id);
    const diff=await sales.compare(quote.id,revision.id,seller);expect(diff.fields.some((f:any)=>f.field==='terms')).toBe(true);
    expect(diff.fields.some((f:any)=>f.field==='milestones')).toBe(false);
    revision=await command(revision,'submit',seller);revision=await command(revision,'approve',manager);
    expect((await sales.detail(quote.id,seller)).status).toBe('superseded');
    expect((await sales.detail(order.id,seller)).source.id).toBe(quote.id);
    for(const name of ['pipeline','conversion','quotations','orders','pending','milestones','intake'])expect((await sales.report(name,{},manager)).definition).toBeTruthy();
    expect((await sales.report('orders',{},manager)).rows[0].gross).toBe('118.00');
    expect((await sales.report('orders',{},outsider)).rows).toHaveLength(0);
    expect((await sales.report('conversion',{},manager)).rows[0]).toEqual({issued:1,accepted:1,conversion_percent:100});
    expect((await sales.report('conversion',{from:'2020-01-01',to:'2020-12-31'},manager)).rows[0].issued).toBe(0);
  });
  it('retains private evidence, communications and deduplicated alerts',async()=>{
    const attachment=await sales.attach(order.id,{buffer:Buffer.from('%PDF-1.4 test'),mimetype:'application/pdf',originalname:'Customer PO.pdf'},seller);
    await expect(sales.download(order.id,attachment.id,outsider)).rejects.toThrow('not found');
    expect((await sales.download(order.id,attachment.id,seller)).content.toString()).toContain('%PDF');
    await sales.comment(order.id,'communication','Customer confirmed delivery date',seller);
    await sales.reminders();await sales.reminders();
    expect((await sales.notifications(seller)).length).toBeGreaterThan(0);
    expect((await sales.notifications(outsider)).length).toBe(0);
  });
  it('retains reasons for return, customer rejection, expiry and cancellation',async()=>{
    let q=await sales.save({...base,kind:'quote'},seller);
    q=await command(q,'submit',seller);
    q=await command(q,'return',manager,{reason:'Clarify warranty'});
    expect(q.status).toBe('draft');
    q=await command(q,'submit',seller);q=await command(q,'approve',manager);
    await expect(db.query(`UPDATE sales_records SET scope='tampered' WHERE id=$1`,[q.id])).rejects.toThrow('immutable');
    q=await command(q,'send',seller);
    await expect(command(q,'customer_reject',seller)).rejects.toThrow('reason');
    q=await command(q,'customer_reject',seller,{reason:'Customer budget declined'});
    expect(q.events.some((e:any)=>e.action==='customer_reject'&&e.reason==='Customer budget declined')).toBe(true);
    let expired=await sales.save({...base,kind:'quote',document_date:'2020-01-01',valid_until:'2020-02-01'},seller);
    expired=await command(expired,'submit',seller);expired=await command(expired,'approve',manager);expired=await command(expired,'send',seller);
    await expect(command(expired,'accept',seller,{evidence:'Late acceptance'})).rejects.toThrow('expired');
    expired=await command(expired,'expire',seller);expect(expired.status).toBe('expired');
    let draft=await sales.save(base,seller);draft=await command(draft,'cancel',manager,{reason:'Duplicate RFQ'});expect(draft.status).toBe('cancelled');
  });
  it('rejects stale approvals and preserves a simple order amendment before project initiation',async()=>{
    let q=await sales.save({...base,kind:'quote'},seller);q=await command(q,'submit',seller);q=await command(q,'approve',manager);q=await command(q,'send',seller);q=await command(q,'accept',seller,{evidence:'Signed order'});
    let o=await command(q,'order',seller);o=await command(o,'submit',seller);o=await command(o,'approve',manager);
    o=await command(o,'hold',manager,{reason:'Customer requested schedule review'});o=await command(o,'resume',manager,{reason:'Schedule agreed'});
    let amendment=await command(o,'revise',seller,{reason:'Correct commercial terms'});
    const lines=amendment.lines.map((l:any)=>({line_key:l.line_key,description:l.description,unit:l.unit,quantity:Number(l.quantity),unit_price:Number(l.unit_price),discount_percent:Number(l.discount_percent),tax_percent:Number(l.tax_percent)}));
    await expect(sales.save({...base,kind:'quote',version:amendment.version,lines:lines.map((l:any)=>({...l,quantity:2}))},seller,amendment.id)).rejects.toThrow('match the accepted quotation');
    amendment=await sales.save({...base,kind:'quote',version:amendment.version,terms:'Amended commercial terms',lines},seller,amendment.id);
    expect(amendment.lines[0].source_line_id).toBe(q.lines[0].id);
    amendment=await command(amendment,'submit',seller);amendment=await command(amendment,'approve',manager);
    expect((await sales.detail(o.id,seller)).status).toBe('superseded');
    expect(amendment.status).toBe('confirmed');
    q=await sales.detail(q.id,seller);let revision=await command(q,'revise',seller,{reason:'Customer changed specification'});revision=await command(revision,'submit',seller);revision=await command(revision,'approve',manager);
    let stale=await command(amendment,'revise',seller,{reason:'Old source'});
    await expect(command(stale,'submit',seller)).rejects.toThrow('current accepted revision');
  });
  it('checks active users and current permissions, audits exports and protects project baselines',async()=>{
    const [project]=await db.query(`SELECT id,runtime_id FROM sales_records WHERE kind='project' LIMIT 1`);
    await expect(sales.assertProjectAccess(project.runtime_id,outsider)).rejects.toThrow('not found');
    await sales.print(project.id,manager);
    await sales.report('intake',{},manager,true);
    expect((await db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action='export'`))[0].n).toBeGreaterThanOrEqual(2);
    await db.query(`UPDATE users SET is_active=false WHERE id=$1`,[outsider.userId]);
    await expect(sales.config(outsider)).rejects.toThrow('inactive');
    await db.query(`UPDATE users SET is_active=true WHERE id=$1`,[outsider.userId]);
    await db.query(`UPDATE role_permissions SET allowed=false WHERE role='sales' AND permission_id IN (SELECT id FROM permissions WHERE code='sales.export')`);
    await expect(sales.report('orders',{},seller,true)).rejects.toThrow('permission');
    await db.query(`UPDATE role_permissions SET allowed=true WHERE role='sales' AND permission_id IN (SELECT id FROM permissions WHERE code='sales.export')`);
    await expect(sales.report('orders',{from:'2026-02-01',to:'2026-01-01'},manager)).rejects.toThrow('From date');
  });
});
