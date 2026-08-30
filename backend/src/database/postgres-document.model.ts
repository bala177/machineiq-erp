import { DataSource, IsNull, Repository } from 'typeorm';
import { RuntimeDocumentEntity } from './entities/runtime-document.entity';
import { DatabaseId } from './postgres-document.types';
import {
  BranchEntity,
  CompanyEntity,
  CustomerEntity,
  DepartmentEntity,
  ItemCategoryEntity,
  ItemEntity,
  LocationEntity,
  SupplierEntity,
  UomEntity,
  UserEntity,
} from './entities/release1.entity';

type AnyDoc = Record<string, any>;
type SortSpec = Record<string, 1 | -1>;

const POPULATE_DOMAIN: Record<string, { domain?: string; table?: string }> = {
  projectId: { domain: 'Project' }, opportunityId: { domain: 'Opportunity' }, convertedProjectId: { domain: 'Project' },
  sourceQuoteId: { domain: 'Quote' }, quoteId: { domain: 'Quote' }, deliverableId: { domain: 'Deliverable' },
  machineId: { domain: 'Machine' }, unitId: { domain: 'Unit' }, equipmentModuleId: { domain: 'EquipmentModule' },
  controlModuleId: { domain: 'ControlModule' }, templateId: { domain: 'MachineTemplate' },
  customerId: { table: 'customers' }, supplierId: { table: 'suppliers' }, itemId: { table: 'items' },
  categoryId: { table: 'item_categories' }, uomId: { table: 'uoms' }, defaultSupplierId: { table: 'suppliers' },
  departmentId: { table: 'departments' }, branchId: { table: 'branches' }, companyId: { table: 'companies' },
  ownerId: { table: 'users' }, createdBy: { table: 'users' }, assignedReviewer: { table: 'users' },
  projectManagerId: { table: 'users' }, uploadedBy: { table: 'users' }, madeBy: { table: 'users' },
  authorId: { table: 'users' }, userId: { table: 'users' }, resolvedBy: { table: 'users' },
};

const ENTITY_BY_DOMAIN: Record<string, any> = {
  User: UserEntity,
  Department: DepartmentEntity,
  Customer: CustomerEntity,
  Supplier: SupplierEntity,
  Item: ItemEntity,
  ItemCategory: ItemCategoryEntity,
  Uom: UomEntity,
  Company: CompanyEntity,
  Branch: BranchEntity,
  Location: LocationEntity,
};

const normalize = (value: any): any => value instanceof DatabaseId ? value.toString() : value;
const plain = (value: any): any => {
  if (value instanceof DatabaseId) return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !['save', 'toObject', 'markModified'].includes(key))
      .map(([key, item]) => [key, plain(item)]));
  }
  return value;
};

const getPath = (object: any, path: string): any => path.split('.').reduce((value, key) => value?.[key], object);
const comparable = (value: any): any => {
  const normalized = normalize(value);
  if (normalized instanceof Date) return normalized.getTime();
  if (typeof normalized === 'string' && /^\d{4}-\d\d-\d\dT/.test(normalized)) return Date.parse(normalized);
  return normalized;
};

function matchesValue(actual: any, expected: any): boolean {
  actual = normalize(actual);
  if (expected instanceof RegExp) return expected.test(String(actual ?? ''));
  if (expected && typeof expected === 'object' && !(expected instanceof Date) && !(expected instanceof DatabaseId) && !Array.isArray(expected)) {
    if ('$eq' in expected && comparable(actual) !== comparable(expected.$eq)) return false;
    if ('$ne' in expected && comparable(actual) === comparable(expected.$ne)) return false;
    if ('$in' in expected && !expected.$in.some((item: any) => comparable(item) === comparable(actual))) return false;
    if ('$nin' in expected && expected.$nin.some((item: any) => comparable(item) === comparable(actual))) return false;
    if ('$lt' in expected && !(comparable(actual) < comparable(expected.$lt))) return false;
    if ('$lte' in expected && !(comparable(actual) <= comparable(expected.$lte))) return false;
    if ('$gt' in expected && !(comparable(actual) > comparable(expected.$gt))) return false;
    if ('$gte' in expected && !(comparable(actual) >= comparable(expected.$gte))) return false;
    if ('$exists' in expected && (actual !== undefined && actual !== null) !== Boolean(expected.$exists)) return false;
    if ('$regex' in expected) {
      const expression = expected.$regex instanceof RegExp
        ? expected.$regex
        : new RegExp(expected.$regex, expected.$options || '');
      if (!expression.test(String(actual ?? ''))) return false;
    }
    return true;
  }
  if (expected === null) return actual === null || actual === undefined;
  return comparable(actual) === comparable(expected);
}

function matches(doc: AnyDoc, filter: AnyDoc = {}): boolean {
  if (filter.$or && !filter.$or.some((part: AnyDoc) => matches(doc, part))) return false;
  if (filter.$and && !filter.$and.every((part: AnyDoc) => matches(doc, part))) return false;
  return Object.entries(filter)
    .filter(([key]) => !key.startsWith('$'))
    .every(([key, expected]) => matchesValue(getPath(doc, key), expected));
}

function applyUpdate(doc: AnyDoc, update: AnyDoc): AnyDoc {
  const result = { ...doc };
  const direct = Object.keys(update).some((key) => key.startsWith('$')) ? {} : update;
  Object.assign(result, plain(direct), plain(update.$set || {}));
  for (const [key, value] of Object.entries(update.$inc || {})) result[key] = Number(result[key] || 0) + Number(value);
  for (const [key, value] of Object.entries(update.$push || {})) result[key] = [...(result[key] || []), plain(value)];
  for (const [key, value] of Object.entries(update.$pull || {})) result[key] = (result[key] || []).filter((item: any) => !matchesValue(item, value));
  return result;
}

const snakeToCamel = (row: AnyDoc): AnyDoc => Object.fromEntries(Object.entries(row).map(([key, value]) => [
  key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), value,
]));

export class PgDocumentQuery<T = AnyDoc> implements PromiseLike<T> {
  private populations: Array<{ path: string; select?: string }> = [];
  private sorting?: SortSpec;
  private offset = 0;
  private maximum?: number;
  private selection?: string;

  constructor(private readonly loader: () => Promise<any>, private readonly model: PgDocumentModel<any>) {}

  populate(pathOrOptions: string | { path: string; select?: string }, select?: string): this {
    this.populations.push(typeof pathOrOptions === 'string' ? { path: pathOrOptions, select } : pathOrOptions);
    return this;
  }
  sort(spec: SortSpec): this { this.sorting = spec; return this; }
  skip(value: number): this { this.offset = value; return this; }
  limit(value: number): this { this.maximum = value; return this; }
  select(value: string): this { this.selection = value; return this; }
  lean<TResult = T>(): PgDocumentQuery<TResult> { return this as unknown as PgDocumentQuery<TResult>; }

  async exec(): Promise<any> {
    let result = await this.loader();
    const array = Array.isArray(result) ? result : result ? [result] : [];
    if (this.sorting) array.sort((left, right) => {
      for (const [key, direction] of Object.entries(this.sorting!)) {
        const a = comparable(getPath(left, key)); const b = comparable(getPath(right, key));
        if (a < b) return -1 * direction; if (a > b) return direction;
      }
      return 0;
    });
    let sliced = array.slice(this.offset, this.maximum === undefined ? undefined : this.offset + this.maximum);
    for (const population of this.populations) sliced = await Promise.all(sliced.map((doc) => this.model.populate(doc, population.path, population.select)));
    if (this.selection) sliced = sliced.map((doc) => this.model.select(doc, this.selection!));
    return Array.isArray(result) ? sliced : (sliced[0] ?? null);
  }

  then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

export type Model<_T> = PgDocumentModel<any>;

export class PgDocumentModel<T = AnyDoc> {
  constructor(
    private readonly repository: Repository<RuntimeDocumentEntity>,
    private readonly dataSource: DataSource,
    readonly domain: string,
  ) {}

  private async all(): Promise<AnyDoc[]> {
    const entity = ENTITY_BY_DOMAIN[this.domain];
    if (entity) {
      const rows = await this.dataSource.getRepository(entity).find({ withDeleted: true });
      return rows.map((row: AnyDoc) => this.hydrateRelational(row));
    }
    const rows = await this.repository.find({ where: { domain: this.domain } });
    return rows.map((row) => this.hydrate(row));
  }

  private hydrateRelational(row: AnyDoc): AnyDoc {
    const doc: AnyDoc = { ...row };
    Object.defineProperties(doc, {
      toObject: { enumerable: false, value: () => plain(doc) },
      markModified: { enumerable: false, value: () => undefined },
      save: { enumerable: false, value: async () => this.persist(doc) },
    });
    return doc;
  }

  private hydrate(row: RuntimeDocumentEntity): AnyDoc {
    const doc: AnyDoc = { ...row.data, _id: row._id, deletedAt: row.deletedAt, createdAt: row.createdAt, updatedAt: row.updatedAt };
    Object.defineProperties(doc, {
      toObject: { enumerable: false, value: () => plain(doc) },
      markModified: { enumerable: false, value: () => undefined },
      save: { enumerable: false, value: async () => this.persist(doc) },
    });
    return doc;
  }

  private async persist(doc: AnyDoc): Promise<AnyDoc> {
    const id = DatabaseId.isValid(normalize(doc._id)) ? normalize(doc._id) : undefined;
    const relationalEntity = ENTITY_BY_DOMAIN[this.domain];
    if (relationalEntity) {
      const relationalRepository = this.dataSource.getRepository(relationalEntity);
      const values = plain(Object.fromEntries(Object.entries(doc).filter(([key]) => !['createdAt', 'updatedAt'].includes(key))));
      const entity = id
        ? await relationalRepository.preload({ ...values, _id: id })
        : relationalRepository.create(values);
      if (!entity) throw new Error(`${this.domain} record no longer exists`);
      return this.hydrateRelational(await relationalRepository.save(entity));
    }
    const entity = this.repository.create({
      ...(id ? { _id: id } : {}), domain: this.domain,
      data: plain(Object.fromEntries(Object.entries(doc).filter(([key]) => !['_id', 'createdAt', 'updatedAt', 'deletedAt'].includes(key)))),
      deletedAt: doc.deletedAt ? new Date(doc.deletedAt) : null,
    });
    return this.hydrate(await this.repository.save(entity));
  }

  async create(data: any): Promise<any> { return this.persist({ ...data }); }
  find(filter: AnyDoc = {}): PgDocumentQuery<any[]> { return new PgDocumentQuery(async () => (await this.all()).filter((doc) => matches(doc, filter)), this); }
  findOne(filter: AnyDoc = {}): PgDocumentQuery<any> { return new PgDocumentQuery(async () => (await this.all()).find((doc) => matches(doc, filter)) || null, this); }
  findById(id: any): PgDocumentQuery<any> { return this.findOne({ _id: normalize(id) }); }
  async exists(filter: AnyDoc): Promise<{ _id: string } | null> { const found = await this.findOne(filter); return found ? { _id: found._id } : null; }
  async countDocuments(filter: AnyDoc = {}): Promise<number> { return (await this.all()).filter((doc) => matches(doc, filter)).length; }

  findByIdAndUpdate(id: any, update: AnyDoc, options: AnyDoc = {}): PgDocumentQuery<any> {
    return this.findOneAndUpdate({ _id: normalize(id) }, update, options);
  }
  findOneAndUpdate(filter: AnyDoc, update: AnyDoc, _options: AnyDoc = {}): PgDocumentQuery<any> {
    return new PgDocumentQuery(async () => {
      const found = await this.findOne(filter);
      if (!found) return null;
      return this.persist(applyUpdate(found, update));
    }, this);
  }
  async updateOne(filter: AnyDoc, update: AnyDoc): Promise<{ modifiedCount: number }> {
    const found = await this.findOne(filter);
    if (!found) return { modifiedCount: 0 };
    await this.persist(applyUpdate(found, update));
    return { modifiedCount: 1 };
  }
  async updateMany(filter: AnyDoc, update: AnyDoc): Promise<{ modifiedCount: number }> {
    const found = (await this.all()).filter((doc) => matches(doc, filter));
    await Promise.all(found.map((doc) => this.persist(applyUpdate(doc, update))));
    return { modifiedCount: found.length };
  }
  async distinct(field: string, filter: AnyDoc = {}): Promise<any[]> {
    return [...new Set((await this.all()).filter((doc) => matches(doc, filter)).map((doc) => normalize(getPath(doc, field))).filter(Boolean))];
  }

  async populate(doc: AnyDoc, path: string, select?: string): Promise<AnyDoc> {
    const raw = getPath(doc, path);
    if (!raw) return doc;
    const mapping = POPULATE_DOMAIN[path];
    if (!mapping) return doc;
    const populateOne = async (id: any): Promise<any> => {
      const normalizedId = normalize(id);
      let related: AnyDoc | null = null;
      if (mapping.domain) {
        const relationalEntity = ENTITY_BY_DOMAIN[mapping.domain];
        if (relationalEntity) {
          const row = await this.dataSource.getRepository(relationalEntity).findOne({ where: { _id: normalizedId } });
          if (row) related = this.hydrateRelational(row);
        } else {
          const row = await this.repository.findOne({ where: { domain: mapping.domain, _id: normalizedId } });
          if (row) related = this.hydrate(row);
        }
      } else if (mapping.table) {
        const rows = await this.dataSource.query(`SELECT * FROM "${mapping.table}" WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [normalizedId]);
        if (rows[0]) related = { ...snakeToCamel(rows[0]), _id: rows[0].id };
      }
      return related ? this.select(related, select || '') : id;
    };
    doc[path] = Array.isArray(raw) ? await Promise.all(raw.map(populateOne)) : await populateOne(raw);
    return doc;
  }

  select(doc: AnyDoc, fields: string): AnyDoc {
    if (!fields) return doc;
    const names = fields.split(/\s+/).filter(Boolean);
    return Object.fromEntries([['_id', doc._id], ...names.map((name) => [name, doc[name]])]);
  }

  async aggregate(pipeline: AnyDoc[]): Promise<AnyDoc[]> {
    let rows: AnyDoc[] = await this.all();
    for (const stage of pipeline) {
      if (stage.$match) rows = rows.filter((row) => matches(row, stage.$match));
      else if (stage.$group) {
        const groupPath = String(stage.$group._id || '').replace(/^\$/, '');
        const groups = new Map<string, AnyDoc[]>();
        for (const row of rows) {
          const value = normalize(getPath(row, groupPath)); const key = JSON.stringify(value ?? null);
          groups.set(key, [...(groups.get(key) || []), row]);
        }
        rows = [...groups.entries()].map(([key, members]) => {
          const output: AnyDoc = { _id: JSON.parse(key) };
          for (const [name, expression] of Object.entries(stage.$group)) {
            if (name === '_id') continue;
            if ((expression as any).$sum === 1) output[name] = members.length;
            else if ((expression as any).$first) output[name] = getPath(members[0], String((expression as any).$first).replace(/^\$/, ''));
            else if ((expression as any).$sum?.$cond) {
              const [condition, yes, no] = (expression as any).$sum.$cond;
              output[name] = members.reduce((total, member) => total + (this.evaluateCondition(member, condition) ? yes : no), 0);
            }
          }
          return output;
        });
      } else if (stage.$sort) {
        const spec = stage.$sort as SortSpec;
        rows.sort((a, b) => Object.entries(spec).reduce((result, [key, direction]) => result || (comparable(a[key]) < comparable(b[key]) ? -direction : comparable(a[key]) > comparable(b[key]) ? direction : 0), 0));
      }
      // $lookup/$unwind/$project are populated by dashboard fallbacks where
      // necessary; group/count semantics remain deterministic in PostgreSQL.
    }
    return rows;
  }

  private evaluateCondition(row: AnyDoc, condition: AnyDoc): boolean {
    if (condition.$eq) return comparable(getPath(row, String(condition.$eq[0]).replace(/^\$/, ''))) === comparable(condition.$eq[1]);
    if (condition.$in) return condition.$in[1].some((item: any) => comparable(item) === comparable(getPath(row, String(condition.$in[0]).replace(/^\$/, ''))));
    return false;
  }
}
