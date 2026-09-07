import { MigrationInterface, QueryRunner } from 'typeorm';

export class Release2Sales2026090700001 implements MigrationInterface {
  name = 'Release2Sales2026090700001';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE sales_access (
        user_id uuid PRIMARY KEY REFERENCES users(id), company_id uuid NOT NULL REFERENCES companies(id),
        scope varchar(12) NOT NULL DEFAULT 'own' CHECK(scope IN ('own','all'))
      );
      INSERT INTO sales_access(user_id,company_id,scope)
        SELECT u.id,c.id,CASE WHEN u.role::text IN ('admin','manager','leadership') THEN 'all' ELSE 'own' END
        FROM users u CROSS JOIN companies c WHERE c.deleted_at IS NULL AND c.is_active
        AND (SELECT count(*) FROM companies WHERE deleted_at IS NULL AND is_active)=1;
      CREATE TABLE sales_settings (
        company_id uuid PRIMARY KEY REFERENCES companies(id),
        separate_approver boolean NOT NULL DEFAULT true,
        currencies jsonb NOT NULL DEFAULT '{"INR":2,"EUR":2,"USD":2,"GBP":2,"JPY":0}',
        taxes jsonb NOT NULL DEFAULT '[0,5,12,18,28]',
        prefixes jsonb NOT NULL DEFAULT '{"enquiry":"ENQ","quote":"QTE","order":"SO","project":"SPJ"}'
      );
      INSERT INTO sales_settings(company_id) SELECT id FROM companies WHERE deleted_at IS NULL;
      CREATE TABLE sales_sites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES companies(id),
        customer_id uuid NOT NULL REFERENCES customers(id), name varchar(200) NOT NULL,
        address text NOT NULL, contact varchar(300) NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
        UNIQUE(id,company_id,customer_id)
      );
      CREATE TABLE sales_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES companies(id),
        kind varchar(12) NOT NULL CHECK(kind IN ('enquiry','quote','order','project')),
        number varchar(100) NOT NULL, family_id uuid NOT NULL REFERENCES sales_records(id) DEFERRABLE INITIALLY DEFERRED,
        revision integer NOT NULL DEFAULT 1 CHECK(revision>0), version integer NOT NULL DEFAULT 1,
        status varchar(24) NOT NULL DEFAULT 'draft', approval varchar(20) NOT NULL DEFAULT 'pending',
        is_current boolean NOT NULL DEFAULT true, source_id uuid REFERENCES sales_records(id),
        predecessor_id uuid REFERENCES sales_records(id), superseded_by uuid REFERENCES sales_records(id),
        customer_id uuid NOT NULL REFERENCES customers(id), site_id uuid,
        branch_id uuid REFERENCES branches(id), owner_id uuid NOT NULL REFERENCES users(id),
        created_by uuid NOT NULL REFERENCES users(id), authored_by uuid REFERENCES users(id), approved_by uuid REFERENCES users(id), approved_at timestamptz,
        title varchar(200) NOT NULL, machine_category varchar(120) NOT NULL DEFAULT '',
        quantity numeric(20,6) NOT NULL DEFAULT 1 CHECK(quantity>0),
        document_date date NOT NULL DEFAULT CURRENT_DATE, valid_until date, start_date date, delivery_date date,
        currency varchar(3) NOT NULL, currency_precision integer NOT NULL CHECK(currency_precision BETWEEN 0 AND 4),
        net numeric(24,4) NOT NULL DEFAULT 0 CHECK(net>=0), tax numeric(24,4) NOT NULL DEFAULT 0 CHECK(tax>=0),
        gross numeric(24,4) NOT NULL DEFAULT 0 CHECK(gross=net+tax),
        scope text NOT NULL DEFAULT '', exclusions text NOT NULL DEFAULT '', warranty text NOT NULL DEFAULT '',
        terms text NOT NULL DEFAULT '', customer_po varchar(200) NOT NULL DEFAULT '',
        inquiry_source varchar(120) NOT NULL DEFAULT '', requirements jsonb NOT NULL DEFAULT '{}',
        snapshot jsonb NOT NULL DEFAULT '{}', accepted_evidence text NOT NULL DEFAULT '',
        accepted_at timestamptz, sent_at timestamptz, confirmed_at timestamptz,
        runtime_id uuid, runtime_domain varchar(80),
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(company_id,number,revision), UNIQUE(family_id,revision), UNIQUE(id,company_id),
        FOREIGN KEY(site_id,company_id,customer_id) REFERENCES sales_sites(id,company_id,customer_id),
        FOREIGN KEY(source_id,company_id) REFERENCES sales_records(id,company_id),
        FOREIGN KEY(runtime_domain,runtime_id) REFERENCES runtime_documents(domain,id),
        CHECK(runtime_id IS NULL OR (kind='project' AND runtime_domain='Project')),
        CHECK(approval IN ('pending','approved','rejected','returned')),
        CHECK((kind='enquiry' AND status IN ('draft','new','qualified','quoted','won','lost','cancelled')) OR
          (kind='quote' AND status IN ('draft','review','approved','sent','accepted','rejected','expired','superseded','cancelled')) OR
          (kind='order' AND status IN ('draft','review','confirmed','on_hold','partially_delivered','completed','cancelled','superseded')) OR
          (kind='project' AND status IN ('draft','initiated','active','on_hold','closed','cancelled')))
      );
      CREATE UNIQUE INDEX sales_one_operational_revision ON sales_records(family_id)
        WHERE is_current AND status IN ('approved','sent','accepted','confirmed','on_hold','partially_delivered','completed','initiated','active');
      CREATE UNIQUE INDEX sales_one_draft_revision ON sales_records(family_id) WHERE status IN ('draft','review');
      CREATE INDEX sales_record_filter ON sales_records(company_id,kind,status,document_date);
      CREATE INDEX sales_record_owner ON sales_records(company_id,owner_id);
      CREATE TABLE sales_lines (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_id uuid NOT NULL REFERENCES sales_records(id),
        line_key uuid NOT NULL DEFAULT gen_random_uuid(), source_line_id uuid REFERENCES sales_lines(id),
        item_id uuid REFERENCES items(id), uom_id uuid REFERENCES uoms(id),
        description varchar(500) NOT NULL, unit varchar(40) NOT NULL DEFAULT '',
        quantity numeric(20,6) NOT NULL CHECK(quantity>0), unit_price numeric(20,6) NOT NULL CHECK(unit_price>=0),
        discount_percent numeric(9,6) NOT NULL DEFAULT 0 CHECK(discount_percent BETWEEN 0 AND 100),
        tax_percent numeric(9,6) NOT NULL DEFAULT 0 CHECK(tax_percent BETWEEN 0 AND 100),
        net numeric(24,4) NOT NULL CHECK(net>=0), tax numeric(24,4) NOT NULL CHECK(tax>=0),
        gross numeric(24,4) NOT NULL CHECK(gross=net+tax), position integer NOT NULL,
        UNIQUE(record_id,line_key)
      );
      CREATE TABLE sales_milestones (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_id uuid NOT NULL REFERENCES sales_records(id),
        label varchar(200) NOT NULL, trigger varchar(200) NOT NULL DEFAULT '', due_date date,
        amount numeric(24,4) NOT NULL CHECK(amount>0), position integer NOT NULL,
        CHECK(due_date IS NOT NULL OR length(trigger)>0)
      );
      CREATE TABLE sales_conversions (
        source_family uuid PRIMARY KEY REFERENCES sales_records(id), target_family uuid NOT NULL UNIQUE REFERENCES sales_records(id)
      );
      CREATE TABLE sales_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_id uuid NOT NULL REFERENCES sales_records(id),
        actor_id uuid NOT NULL REFERENCES users(id), action varchar(80) NOT NULL, reason text NOT NULL DEFAULT '',
        changes jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE sales_attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), record_id uuid NOT NULL REFERENCES sales_records(id),
        actor_id uuid NOT NULL REFERENCES users(id), name varchar(200) NOT NULL, mime varchar(100) NOT NULL,
        content bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE sales_requests (
        actor_id uuid NOT NULL REFERENCES users(id), key uuid NOT NULL, hash varchar(64) NOT NULL,
        result_id uuid NOT NULL REFERENCES sales_records(id), PRIMARY KEY(actor_id,key)
      );
      CREATE TABLE sales_notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
        record_id uuid NOT NULL REFERENCES sales_records(id), message text NOT NULL, event_key text NOT NULL,
        read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,event_key)
      );
      CREATE FUNCTION sales_history_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Sales history cannot be overwritten or deleted'; END $$;
      CREATE TRIGGER sales_events_immutable BEFORE UPDATE OR DELETE ON sales_events FOR EACH ROW EXECUTE FUNCTION sales_history_immutable();
      CREATE TRIGGER sales_attachments_immutable BEFORE UPDATE OR DELETE ON sales_attachments FOR EACH ROW EXECUTE FUNCTION sales_history_immutable();
      CREATE FUNCTION sales_content_guard() RETURNS trigger LANGUAGE plpgsql AS $$
      DECLARE s text;
      BEGIN
        SELECT status INTO s FROM sales_records WHERE id=COALESCE(NEW.record_id,OLD.record_id);
        IF s NOT IN ('draft','new') THEN RAISE EXCEPTION 'Issued sales content is immutable; create a revision'; END IF;
        RETURN COALESCE(NEW,OLD);
      END $$;
      CREATE TRIGGER sales_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON sales_lines FOR EACH ROW EXECUTE FUNCTION sales_content_guard();
      CREATE TRIGGER sales_milestones_guard BEFORE INSERT OR UPDATE OR DELETE ON sales_milestones FOR EACH ROW EXECUTE FUNCTION sales_content_guard();
      CREATE FUNCTION sales_record_guard() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Sales records must be cancelled, not deleted'; END IF;
        IF OLD.status NOT IN ('draft','new','review') AND
          (to_jsonb(OLD)-ARRAY['status','approval','is_current','superseded_by','version','updated_at','sent_at','accepted_at','accepted_evidence','customer_po'])
          IS DISTINCT FROM
          (to_jsonb(NEW)-ARRAY['status','approval','is_current','superseded_by','version','updated_at','sent_at','accepted_at','accepted_evidence','customer_po'])
        THEN RAISE EXCEPTION 'Approved sales content is immutable; create a revision'; END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER sales_record_immutable BEFORE UPDATE OR DELETE ON sales_records FOR EACH ROW EXECUTE FUNCTION sales_record_guard();
    `);
    for (const action of ['view', 'create', 'edit', 'approve', 'cancel', 'export', 'administer']) {
      await q.query(`INSERT INTO permissions(code,module,action,description) VALUES($1,'sales',$2,$3) ON CONFLICT(code) DO NOTHING`, [`sales.${action}`, action, `Sales: ${action}`]);
      const roles = action === 'administer' ? ['admin'] : ['approve','cancel'].includes(action) ? ['admin','manager'] : action === 'view' || action === 'export' ? ['admin','manager','sales','leadership'] : ['admin','manager','sales'];
      for (const role of roles) await q.query(`INSERT INTO role_permissions(role,permission_id,allowed) SELECT $1,id,true FROM permissions WHERE code=$2 ON CONFLICT(role,permission_id) DO NOTHING`, [role, `sales.${action}`]);
    }
  }
  async down(q: QueryRunner): Promise<void> {
    const [{ count }] = await q.query(`SELECT count(*) FROM sales_records`);
    if (Number(count)) throw new Error('Release 2 contains commercial records. Use the documented backup/recovery or forward-fix procedure.');
    await q.query(`DROP TABLE sales_notifications,sales_requests,sales_attachments,sales_events,sales_conversions,sales_milestones,sales_lines,sales_records,sales_sites,sales_settings,sales_access; DROP FUNCTION sales_record_guard(); DROP FUNCTION sales_content_guard(); DROP FUNCTION sales_history_immutable(); DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE module='sales'); DELETE FROM permissions WHERE module='sales';`);
  }
}
