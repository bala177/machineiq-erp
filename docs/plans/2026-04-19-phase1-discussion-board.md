# Phase 1: Discussion Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a rich-text Discussion Board to the Opportunity detail page so OEM teams can log meetings, calls, emails, and open questions — creating a living record of the customer conversation before and alongside the intake form.

**Architecture:** A new `DiscussionModule` on the backend adds four endpoints nested under `/opportunities/:opportunityId/discussion`. The frontend adds a "Discussion" tab to the existing Opportunity detail page, backed by a TipTap rich-text editor and a timeline-style feed of entries with type icons, open-question tracking, and pin actions.

**Tech Stack:** NestJS + Mongoose (backend), Next.js 14 + TipTap + Tailwind CSS (frontend), Jest (backend tests)

**Branch:** `feature/phase1-discussion-board`  
**Worktree:** `.worktrees/feature-phase1-discussion-board/`

---

## File Map

### New files — Backend
| File | Responsibility |
|------|---------------|
| `backend/src/schemas/discussion.schema.ts` | Mongoose schema for `DiscussionEntry` |
| `backend/src/modules/discussion/discussion.dto.ts` | Validated DTOs for create and update |
| `backend/src/modules/discussion/discussion.service.ts` | Business logic — CRUD + access control |
| `backend/src/modules/discussion/discussion.service.spec.ts` | Unit tests for the service |
| `backend/src/modules/discussion/discussion.controller.ts` | HTTP endpoints |
| `backend/src/modules/discussion/discussion.module.ts` | NestJS module wiring |

### Modified files — Backend
| File | Change |
|------|--------|
| `backend/src/app.module.ts` | Import and register `DiscussionModule` |

### New files — Frontend
| File | Responsibility |
|------|---------------|
| `frontend/src/lib/discussion.ts` | TypeScript types + API helper functions |
| `frontend/src/components/discussion/rich-text-editor.tsx` | TipTap editor wrapper (controlled component) |
| `frontend/src/components/discussion/discussion-entry-form.tsx` | Form: type selector, date, participants, TipTap content |
| `frontend/src/components/discussion/discussion-entry-card.tsx` | Renders one entry: icon, meta, HTML content, actions |
| `frontend/src/components/discussion/open-questions-bar.tsx` | Callout showing count + list of unresolved questions |
| `frontend/src/components/discussion/discussion-board.tsx` | Orchestrates the board: load, filter, add entry |

### Modified files — Frontend
| File | Change |
|------|--------|
| `frontend/src/app/(app)/opportunities/[id]/page.tsx` | Add "Discussion" tab + render `DiscussionBoard` |

---

## Task 1: Backend — Discussion Schema

**Files:**
- Create: `backend/src/schemas/discussion.schema.ts`

- [ ] **Step 1.1: Create the schema file**

```typescript
// backend/src/schemas/discussion.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiscussionEntryType = 'meeting' | 'call' | 'email' | 'note' | 'question' | 'decision';

export const DISCUSSION_ENTRY_TYPES: DiscussionEntryType[] = [
  'meeting', 'call', 'email', 'note', 'question', 'decision',
];

@Schema({ timestamps: true })
export class DiscussionEntry extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Opportunity', required: true })
  opportunityId: Types.ObjectId;

  @Prop({ required: true, enum: DISCUSSION_ENTRY_TYPES })
  type: DiscussionEntryType;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  participants: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  externalParticipants: string[];

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Boolean, default: false })
  isOpenQuestion: boolean;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  resolvedBy: Types.ObjectId | null;

  @Prop({ trim: true, default: '' })
  resolution: string;

  @Prop({ type: Boolean, default: false })
  isPinned: boolean;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const DiscussionEntrySchema = SchemaFactory.createForClass(DiscussionEntry);
DiscussionEntrySchema.index({ opportunityId: 1, date: -1 });
```

- [ ] **Step 1.2: Commit**

```bash
cd .worktrees/feature-phase1-discussion-board
git add backend/src/schemas/discussion.schema.ts
git commit -m "feat(discussion): add DiscussionEntry mongoose schema"
```

---

## Task 2: Backend — DTOs

**Files:**
- Create: `backend/src/modules/discussion/discussion.dto.ts`

- [ ] **Step 2.1: Create the DTO file**

```typescript
// backend/src/modules/discussion/discussion.dto.ts
import {
  IsString, IsNotEmpty, IsEnum, IsOptional,
  IsBoolean, IsArray, IsDateString,
} from 'class-validator';
import { DISCUSSION_ENTRY_TYPES, DiscussionEntryType } from '../../schemas/discussion.schema';

export class CreateDiscussionEntryDto {
  @IsEnum(DISCUSSION_ENTRY_TYPES)
  type: DiscussionEntryType;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsArray()
  participants?: string[];

  @IsOptional()
  @IsArray()
  externalParticipants?: string[];

  @IsOptional()
  @IsBoolean()
  isOpenQuestion?: boolean;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class UpdateDiscussionEntryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isOpenQuestion?: boolean;

  @IsOptional()
  @IsString()
  resolution?: string;
}
```

- [ ] **Step 2.2: Commit**

```bash
git add backend/src/modules/discussion/discussion.dto.ts
git commit -m "feat(discussion): add CreateDiscussionEntryDto and UpdateDiscussionEntryDto"
```

---

## Task 3: Backend — Service (with tests first)

**Files:**
- Create: `backend/src/modules/discussion/discussion.service.ts`
- Create: `backend/src/modules/discussion/discussion.service.spec.ts`

- [ ] **Step 3.1: Write the failing tests first**

```typescript
// backend/src/modules/discussion/discussion.service.spec.ts
import 'reflect-metadata';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { DiscussionService } from './discussion.service';
import { DiscussionEntry } from '../../schemas/discussion.schema';

const validOpportunityId = new Types.ObjectId().toHexString();
const validEntryId = new Types.ObjectId().toHexString();
const validUserId = new Types.ObjectId().toHexString();

function makeModel(savedDoc: any = null) {
  const doc = savedDoc || {
    _id: new Types.ObjectId(validEntryId),
    opportunityId: new Types.ObjectId(validOpportunityId),
    authorId: new Types.ObjectId(validUserId),
    type: 'note',
    content: '<p>test</p>',
    date: new Date(),
    isOpenQuestion: false,
    isPinned: false,
    deletedAt: null,
    toString: () => validEntryId,
  };

  return {
    create: jest.fn().mockResolvedValue(doc),
    find: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([doc]),
    }),
    findOne: jest.fn().mockResolvedValue(doc),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ ...doc, isPinned: true }),
    }),
  };
}

describe('DiscussionService', () => {
  let service: DiscussionService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();
    const module = await Test.createTestingModule({
      providers: [
        DiscussionService,
        { provide: getModelToken(DiscussionEntry.name), useValue: model },
      ],
    }).compile();
    service = module.get(DiscussionService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('throws NotFoundException for an invalid opportunityId', async () => {
      await expect(
        service.create('not-an-objectid', { type: 'note', content: '<p>hi</p>', date: new Date().toISOString() }, validUserId),
      ).rejects.toThrow(NotFoundException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('creates an entry with valid inputs', async () => {
      await service.create(validOpportunityId, { type: 'meeting', content: '<p>discussed scope</p>', date: '2026-04-19' }, validUserId);
      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({
        type: 'meeting',
        content: '<p>discussed scope</p>',
      }));
    });
  });

  describe('findAll', () => {
    it('throws NotFoundException for an invalid opportunityId', async () => {
      await expect(service.findAll('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('queries only non-deleted entries for the opportunity', async () => {
      await service.findAll(validOpportunityId);
      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: null }),
      );
    });
  });

  describe('update', () => {
    it('throws ForbiddenException if non-author non-PM tries to edit', async () => {
      const otherUserId = new Types.ObjectId().toHexString();
      await expect(
        service.update(validOpportunityId, validEntryId, { isPinned: true }, otherUserId, 'engineer'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the author to edit their own entry', async () => {
      await service.update(validOpportunityId, validEntryId, { isPinned: true }, validUserId, 'engineer');
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('allows a project_manager to edit any entry', async () => {
      const pmId = new Types.ObjectId().toHexString();
      await service.update(validOpportunityId, validEntryId, { isPinned: true }, pmId, 'project_manager');
      expect(model.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('sets resolvedAt and resolvedBy when resolution is provided', async () => {
      await service.update(validOpportunityId, validEntryId, { resolution: 'Customer confirmed 200 cans/min' }, validUserId, 'engineer');
      const updateArg = model.findByIdAndUpdate.mock.calls[0][1].$set;
      expect(updateArg.resolution).toBe('Customer confirmed 200 cans/min');
      expect(updateArg.resolvedAt).toBeInstanceOf(Date);
      expect(updateArg.isOpenQuestion).toBe(false);
    });
  });

  describe('remove', () => {
    it('throws ForbiddenException if non-author non-admin tries to delete', async () => {
      const otherId = new Types.ObjectId().toHexString();
      await expect(
        service.remove(validOpportunityId, validEntryId, otherId, 'engineer'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('soft-deletes the entry', async () => {
      await service.remove(validOpportunityId, validEntryId, validUserId, 'engineer');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        validEntryId,
        { $set: { deletedAt: expect.any(Date) } },
      );
    });
  });
});
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
cd .worktrees/feature-phase1-discussion-board/backend
npx jest discussion.service.spec.ts --no-coverage
```

Expected: `FAIL` — `Cannot find module './discussion.service'`

- [ ] **Step 3.3: Implement the service**

```typescript
// backend/src/modules/discussion/discussion.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DiscussionEntry } from '../../schemas/discussion.schema';
import { CreateDiscussionEntryDto, UpdateDiscussionEntryDto } from './discussion.dto';

@Injectable()
export class DiscussionService {
  constructor(
    @InjectModel(DiscussionEntry.name) private entryModel: Model<DiscussionEntry>,
  ) {}

  async create(opportunityId: string, dto: CreateDiscussionEntryDto, authorId: string): Promise<DiscussionEntry> {
    if (!Types.ObjectId.isValid(opportunityId)) throw new NotFoundException('Opportunity not found');
    return this.entryModel.create({
      opportunityId: new Types.ObjectId(opportunityId),
      authorId: new Types.ObjectId(authorId),
      type: dto.type,
      content: dto.content,
      date: new Date(dto.date),
      participants: (dto.participants || [])
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id)),
      externalParticipants: dto.externalParticipants || [],
      isOpenQuestion: dto.isOpenQuestion || false,
      attachments: dto.attachments || [],
      deletedAt: null,
    });
  }

  async findAll(opportunityId: string): Promise<DiscussionEntry[]> {
    if (!Types.ObjectId.isValid(opportunityId)) throw new NotFoundException('Opportunity not found');
    return this.entryModel
      .find({ opportunityId: new Types.ObjectId(opportunityId), deletedAt: null })
      .populate('authorId', 'firstName lastName')
      .populate('participants', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ date: -1 })
      .exec();
  }

  async update(
    opportunityId: string,
    entryId: string,
    dto: UpdateDiscussionEntryDto,
    userId: string,
    userRole: string,
  ): Promise<DiscussionEntry> {
    if (!Types.ObjectId.isValid(entryId)) throw new NotFoundException('Entry not found');
    const entry = await this.entryModel.findOne({ _id: entryId, deletedAt: null });
    if (!entry) throw new NotFoundException('Entry not found');

    const isAuthor = entry.authorId.toString() === userId;
    const isPrivileged = ['admin', 'project_manager'].includes(userRole);
    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException('Only the author, a PM, or an admin can edit this entry');
    }

    const updateData: Record<string, any> = {};
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.isPinned !== undefined) updateData.isPinned = dto.isPinned;
    if (dto.isOpenQuestion !== undefined) updateData.isOpenQuestion = dto.isOpenQuestion;

    if (dto.resolution?.trim()) {
      updateData.resolution = dto.resolution.trim();
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = new Types.ObjectId(userId);
      updateData.isOpenQuestion = false;
    }

    return this.entryModel
      .findByIdAndUpdate(entryId, { $set: updateData }, { new: true })
      .populate('authorId', 'firstName lastName')
      .populate('participants', 'firstName lastName')
      .exec() as Promise<DiscussionEntry>;
  }

  async remove(
    opportunityId: string,
    entryId: string,
    userId: string,
    userRole: string,
  ): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(entryId)) throw new NotFoundException('Entry not found');
    const entry = await this.entryModel.findOne({ _id: entryId, deletedAt: null });
    if (!entry) throw new NotFoundException('Entry not found');

    const isAuthor = entry.authorId.toString() === userId;
    const isAdmin = userRole === 'admin';
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Only the author or an admin can delete this entry');
    }

    await this.entryModel.findByIdAndUpdate(entryId, { $set: { deletedAt: new Date() } });
    return { message: 'Entry deleted' };
  }
}
```

- [ ] **Step 3.4: Run tests — verify they pass**

```bash
npx jest discussion.service.spec.ts --no-coverage
```

Expected: `PASS` — all 9 tests green

- [ ] **Step 3.5: Commit**

```bash
git add backend/src/modules/discussion/
git commit -m "feat(discussion): add DiscussionService with full unit tests"
```

---

## Task 4: Backend — Controller & Module

**Files:**
- Create: `backend/src/modules/discussion/discussion.controller.ts`
- Create: `backend/src/modules/discussion/discussion.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 4.1: Create the controller**

```typescript
// backend/src/modules/discussion/discussion.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionEntryDto, UpdateDiscussionEntryDto } from './discussion.dto';

@Controller('opportunities/:opportunityId/discussion')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  @Roles(Role.SALES, Role.ADMIN, Role.PROJECT_MANAGER, Role.ENGINEER)
  create(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: CreateDiscussionEntryDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.discussionService.create(opportunityId, dto, user.userId);
  }

  @Get()
  findAll(@Param('opportunityId') opportunityId: string) {
    return this.discussionService.findAll(opportunityId);
  }

  @Patch(':entryId')
  @Roles(Role.SALES, Role.ADMIN, Role.PROJECT_MANAGER, Role.ENGINEER)
  update(
    @Param('opportunityId') opportunityId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdateDiscussionEntryDto,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.discussionService.update(opportunityId, entryId, dto, user.userId, user.role);
  }

  @Delete(':entryId')
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.SALES, Role.ENGINEER)
  remove(
    @Param('opportunityId') opportunityId: string,
    @Param('entryId') entryId: string,
    @CurrentUser() user: { userId: string; role: string },
  ) {
    return this.discussionService.remove(opportunityId, entryId, user.userId, user.role);
  }
}
```

- [ ] **Step 4.2: Create the module**

```typescript
// backend/src/modules/discussion/discussion.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscussionService } from './discussion.service';
import { DiscussionController } from './discussion.controller';
import { DiscussionEntry, DiscussionEntrySchema } from '../../schemas/discussion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DiscussionEntry.name, schema: DiscussionEntrySchema },
    ]),
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
  exports: [DiscussionService],
})
export class DiscussionModule {}
```

- [ ] **Step 4.3: Register in app.module.ts**

Add to `backend/src/app.module.ts`:

At the top imports section add:
```typescript
import { DiscussionModule } from './modules/discussion/discussion.module';
```

In the `imports` array, add after `ComponentsModule,`:
```typescript
DiscussionModule,
```

- [ ] **Step 4.4: Run full test suite — verify nothing broken**

```bash
cd .worktrees/feature-phase1-discussion-board/backend
npx jest --no-coverage
```

Expected: All 36 existing tests + 9 new = 45 tests passing

- [ ] **Step 4.5: Commit**

```bash
git add backend/src/modules/discussion/discussion.controller.ts
git add backend/src/modules/discussion/discussion.module.ts
git add backend/src/app.module.ts
git commit -m "feat(discussion): wire controller and module, register in AppModule"
```

---

## Task 5: Frontend — Install TipTap & Types

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Create: `frontend/src/lib/discussion.ts`

- [ ] **Step 5.1: Install TipTap packages**

```bash
cd .worktrees/feature-phase1-discussion-board/frontend
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
```

Expected: packages added to `package.json` and `package-lock.json`, no errors.

- [ ] **Step 5.2: Create the discussion types and API helpers**

```typescript
// frontend/src/lib/discussion.ts

export type DiscussionEntryType = 'meeting' | 'call' | 'email' | 'note' | 'question' | 'decision';

export const ENTRY_TYPE_META: Record<DiscussionEntryType, { label: string; color: string; bgColor: string; borderColor: string }> = {
  meeting:  { label: 'Meeting',  color: 'text-violet-700', bgColor: 'bg-violet-50',  borderColor: 'border-violet-200' },
  call:     { label: 'Call',     color: 'text-blue-700',   bgColor: 'bg-blue-50',    borderColor: 'border-blue-200'   },
  email:    { label: 'Email',    color: 'text-sky-700',    bgColor: 'bg-sky-50',     borderColor: 'border-sky-200'    },
  note:     { label: 'Note',     color: 'text-slate-700',  bgColor: 'bg-slate-50',   borderColor: 'border-slate-200'  },
  question: { label: 'Question', color: 'text-amber-700',  bgColor: 'bg-amber-50',   borderColor: 'border-amber-200'  },
  decision: { label: 'Decision', color: 'text-green-700',  bgColor: 'bg-green-50',   borderColor: 'border-green-200'  },
};

export const ENTRY_TYPES = Object.keys(ENTRY_TYPE_META) as DiscussionEntryType[];

export interface DiscussionParticipant {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface DiscussionEntry {
  _id: string;
  opportunityId: string;
  type: DiscussionEntryType;
  content: string;
  authorId: DiscussionParticipant;
  participants: DiscussionParticipant[];
  externalParticipants: string[];
  date: string;
  isOpenQuestion: boolean;
  resolvedAt: string | null;
  resolvedBy: DiscussionParticipant | null;
  resolution: string;
  isPinned: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscussionEntryPayload {
  type: DiscussionEntryType;
  content: string;
  date: string;
  participants?: string[];
  externalParticipants?: string[];
  isOpenQuestion?: boolean;
}

export interface UpdateDiscussionEntryPayload {
  content?: string;
  isPinned?: boolean;
  isOpenQuestion?: boolean;
  resolution?: string;
}

export function personName(p?: { firstName?: string; lastName?: string } | null): string {
  if (!p) return 'Unknown';
  return `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown';
}

export function formatEntryDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
```

- [ ] **Step 5.3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/lib/discussion.ts
git commit -m "feat(discussion): install TipTap, add discussion types and API helpers"
```

---

## Task 6: Frontend — Rich Text Editor Component

**Files:**
- Create: `frontend/src/components/discussion/rich-text-editor.tsx`

- [ ] **Step 6.1: Create the TipTap wrapper**

```tsx
// frontend/src/components/discussion/rich-text-editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';
import { clsx } from 'clsx';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something…',
  disabled = false,
  minHeight = 'min-h-32',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const ToolBtn = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={clsx(
        'rounded p-1.5 transition-colors',
        active
          ? 'bg-fg text-bg'
          : 'text-fg-secondary hover:bg-surface-tertiary hover:text-fg',
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={clsx('rounded-xl border border-border bg-surface overflow-hidden', disabled && 'opacity-60')}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1.5">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className={clsx(
          minHeight,
          'px-3 py-2.5 text-sm text-fg focus-within:outline-none',
          '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[inherit]',
          '[&_.ProseMirror_p]:my-1 [&_.ProseMirror_ul]:ml-4 [&_.ProseMirror_ol]:ml-4',
          '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal',
          '[&_.ProseMirror_strong]:font-semibold [&_.ProseMirror_em]:italic',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-fg-tertiary',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
        )}
      />
    </div>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
git add frontend/src/components/discussion/rich-text-editor.tsx
git commit -m "feat(discussion): add TipTap RichTextEditor component"
```

---

## Task 7: Frontend — Entry Form Component

**Files:**
- Create: `frontend/src/components/discussion/discussion-entry-form.tsx`

- [ ] **Step 7.1: Create the form**

```tsx
// frontend/src/components/discussion/discussion-entry-form.tsx
'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from './rich-text-editor';
import {
  CreateDiscussionEntryPayload,
  ENTRY_TYPES,
  ENTRY_TYPE_META,
  DiscussionEntryType,
} from '@/lib/discussion';

interface DiscussionEntryFormProps {
  onSubmit: (payload: CreateDiscussionEntryPayload) => Promise<void>;
}

export function DiscussionEntryForm({ onSubmit }: DiscussionEntryFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<DiscussionEntryType>('note');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(today);
  const [externalParticipants, setExternalParticipants] = useState('');
  const [isOpenQuestion, setIsOpenQuestion] = useState(false);

  const reset = () => {
    setType('note');
    setContent('');
    setDate(today);
    setExternalParticipants('');
    setIsOpenQuestion(false);
    setError('');
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!content || content === '<p></p>') { setError('Please add some content.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        type,
        content,
        date,
        externalParticipants: externalParticipants
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        isOpenQuestion,
      });
      reset();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-sm text-fg-muted transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/20 dark:hover:text-blue-400"
      >
        <Plus className="h-4 w-4" />
        Log a meeting, call, email, note or question
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800 dark:bg-blue-950/20">
      {/* Type selector */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ENTRY_TYPES.map((t) => {
          const meta = ENTRY_TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                type === t
                  ? `${meta.bgColor} ${meta.color} ${meta.borderColor}`
                  : 'border-border bg-surface text-fg-secondary hover:bg-surface-tertiary',
              )}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        {/* Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-secondary">Date</label>
          <input
            type="date"
            className="input-field text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* External participants */}
        <div>
          <label className="mb-1 block text-xs font-medium text-fg-secondary">
            External participants <span className="font-normal text-fg-tertiary">(comma-separated names)</span>
          </label>
          <input
            type="text"
            className="input-field text-sm"
            value={externalParticipants}
            onChange={(e) => setExternalParticipants(e.target.value)}
            placeholder="e.g. Jane Smith (Nestlé), Bob Lee"
          />
        </div>
      </div>

      {/* Rich text */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-fg-secondary">Notes</label>
        <RichTextEditor value={content} onChange={setContent} placeholder="What was discussed, decided, or asked?" />
      </div>

      {/* Open question toggle */}
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border text-amber-500 accent-amber-500"
          checked={isOpenQuestion}
          onChange={(e) => setIsOpenQuestion(e.target.checked)}
        />
        <span className="text-fg-secondary">Mark as open question — needs a follow-up answer</span>
      </label>

      {error && <p className="mb-2 text-xs font-medium text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Add Entry'}
        </button>
        <button type="button" onClick={reset} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
git add frontend/src/components/discussion/discussion-entry-form.tsx
git commit -m "feat(discussion): add DiscussionEntryForm with type selector and TipTap"
```

---

## Task 8: Frontend — Entry Card Component

**Files:**
- Create: `frontend/src/components/discussion/discussion-entry-card.tsx`

- [ ] **Step 8.1: Create the entry card**

```tsx
// frontend/src/components/discussion/discussion-entry-card.tsx
'use client';

import { useState } from 'react';
import { Pin, PinOff, CheckCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { RichTextEditor } from './rich-text-editor';
import {
  DiscussionEntry,
  ENTRY_TYPE_META,
  UpdateDiscussionEntryPayload,
  personName,
  formatEntryDate,
} from '@/lib/discussion';

interface DiscussionEntryCardProps {
  entry: DiscussionEntry;
  currentUserId: string;
  currentUserRole: string;
  onUpdate: (entryId: string, payload: UpdateDiscussionEntryPayload) => Promise<void>;
  onDelete: (entryId: string) => Promise<void>;
}

export function DiscussionEntryCard({
  entry,
  currentUserId,
  currentUserRole,
  onUpdate,
  onDelete,
}: DiscussionEntryCardProps) {
  const meta = ENTRY_TYPE_META[entry.type];
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');
  const [busy, setBusy] = useState(false);

  const canEdit = entry.authorId._id === currentUserId || ['admin', 'project_manager'].includes(currentUserRole);
  const canDelete = entry.authorId._id === currentUserId || currentUserRole === 'admin';
  const isResolved = Boolean(entry.resolvedAt);

  const handlePin = async () => {
    setBusy(true);
    try { await onUpdate(entry._id, { isPinned: !entry.isPinned }); } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this entry?')) return;
    setBusy(true);
    try { await onDelete(entry._id); } finally { setBusy(false); }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) return;
    setBusy(true);
    try {
      await onUpdate(entry._id, { resolution });
      setShowResolve(false);
      setResolution('');
    } finally { setBusy(false); }
  };

  return (
    <div className={clsx(
      'rounded-xl border p-4 transition-all',
      entry.isPinned ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : `${meta.borderColor} ${meta.bgColor}/30`,
      isResolved && entry.isOpenQuestion === false && entry.resolution && 'opacity-80',
    )}>
      {/* Header row */}
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type badge */}
          <span className={clsx('rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.color, meta.bgColor, meta.borderColor)}>
            {meta.label}
          </span>

          {/* Open question badge */}
          {entry.isOpenQuestion && !isResolved && (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Open question
            </span>
          )}

          {/* Pinned badge */}
          {entry.isPinned && (
            <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-400">
              Pinned
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={handlePin}
              disabled={busy}
              title={entry.isPinned ? 'Unpin' : 'Pin as key decision'}
              className="rounded-lg p-1.5 text-fg-tertiary hover:bg-surface-tertiary hover:text-fg transition-colors"
            >
              {entry.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
          {canEdit && entry.isOpenQuestion && !isResolved && (
            <button
              type="button"
              onClick={() => setShowResolve(v => !v)}
              title="Mark as resolved"
              className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors dark:hover:bg-amber-950/20"
            >
              <CheckCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              title="Delete entry"
              className="rounded-lg p-1.5 text-fg-tertiary hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta line */}
      <p className="mb-2 text-xs text-fg-muted">
        {formatEntryDate(entry.date)} · {personName(entry.authorId)}
        {entry.externalParticipants.length > 0 && ` · with ${entry.externalParticipants.join(', ')}`}
        {entry.participants.length > 0 && ` · ${entry.participants.map(personName).join(', ')}`}
      </p>

      {/* Rich text content */}
      <div
        className="prose prose-sm max-w-none text-fg [&_ul]:ml-4 [&_ul]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_em]:italic [&_p]:my-1"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />

      {/* Resolved state */}
      {isResolved && entry.resolution && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-2.5 dark:border-green-800 dark:bg-green-950/30">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">Resolved</p>
          <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">{entry.resolution}</p>
          {entry.resolvedBy && (
            <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
              by {personName(entry.resolvedBy)} · {entry.resolvedAt ? formatEntryDate(entry.resolvedAt) : ''}
            </p>
          )}
        </div>
      )}

      {/* Resolve form */}
      {showResolve && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">What was the resolution?</p>
          <textarea
            className="input-field min-h-16 text-sm"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Customer confirmed 200 cans/min. Decision: proceed with this spec."
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleResolve} disabled={busy || !resolution.trim()} className="btn-primary text-xs py-1.5">
              Mark Resolved
            </button>
            <button type="button" onClick={() => setShowResolve(false)} className="btn-ghost text-xs py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: Commit**

```bash
git add frontend/src/components/discussion/discussion-entry-card.tsx
git commit -m "feat(discussion): add DiscussionEntryCard with pin, resolve, delete actions"
```

---

## Task 9: Frontend — Open Questions Bar

**Files:**
- Create: `frontend/src/components/discussion/open-questions-bar.tsx`

- [ ] **Step 9.1: Create the open questions callout**

```tsx
// frontend/src/components/discussion/open-questions-bar.tsx
import { AlertCircle } from 'lucide-react';
import { DiscussionEntry } from '@/lib/discussion';

interface OpenQuestionsBarProps {
  entries: DiscussionEntry[];
}

export function OpenQuestionsBar({ entries }: OpenQuestionsBarProps) {
  const open = entries.filter(e => e.isOpenQuestion && !e.resolvedAt);
  if (open.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          {open.length} open {open.length === 1 ? 'question' : 'questions'} need a follow-up
        </p>
      </div>
      <ul className="space-y-1 pl-6">
        {open.map(entry => (
          <li key={entry._id} className="text-xs text-amber-700 dark:text-amber-300 list-disc">
            <span
              className="[&_p]:inline [&_strong]:font-semibold [&_em]:italic"
              dangerouslySetInnerHTML={{
                __html: entry.content.replace(/<[^>]+>/g, ' ').trim().slice(0, 120) + (entry.content.length > 120 ? '…' : ''),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add frontend/src/components/discussion/open-questions-bar.tsx
git commit -m "feat(discussion): add OpenQuestionsBar callout component"
```

---

## Task 10: Frontend — Discussion Board (Orchestrator)

**Files:**
- Create: `frontend/src/components/discussion/discussion-board.tsx`

- [ ] **Step 10.1: Create the board**

```tsx
// frontend/src/components/discussion/discussion-board.tsx
'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { api } from '@/lib/api';
import {
  DiscussionEntry,
  DiscussionEntryType,
  ENTRY_TYPES,
  ENTRY_TYPE_META,
  CreateDiscussionEntryPayload,
  UpdateDiscussionEntryPayload,
} from '@/lib/discussion';
import { DiscussionEntryForm } from './discussion-entry-form';
import { DiscussionEntryCard } from './discussion-entry-card';
import { OpenQuestionsBar } from './open-questions-bar';

interface DiscussionBoardProps {
  opportunityId: string;
  currentUserId: string;
  currentUserRole: string;
}

type FilterType = 'all' | DiscussionEntryType;

export function DiscussionBoard({ opportunityId, currentUserId, currentUserRole }: DiscussionBoardProps) {
  const [entries, setEntries] = useState<DiscussionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const load = async () => {
    try {
      const data = await api.get<DiscussionEntry[]>(`/opportunities/${opportunityId}/discussion`);
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [opportunityId]);

  const handleCreate = async (payload: CreateDiscussionEntryPayload) => {
    const created = await api.post<DiscussionEntry>(`/opportunities/${opportunityId}/discussion`, payload);
    setEntries(prev => [created, ...prev]);
  };

  const handleUpdate = async (entryId: string, payload: UpdateDiscussionEntryPayload) => {
    const updated = await api.patch<DiscussionEntry>(
      `/opportunities/${opportunityId}/discussion/${entryId}`,
      payload,
    );
    setEntries(prev => prev.map(e => e._id === entryId ? updated : e));
  };

  const handleDelete = async (entryId: string) => {
    await api.delete(`/opportunities/${opportunityId}/discussion/${entryId}`);
    setEntries(prev => prev.filter(e => e._id !== entryId));
  };

  const visible = filter === 'all' ? entries : entries.filter(e => e.type === filter);
  const pinnedCount = entries.filter(e => e.isPinned).length;

  if (loading) return <p className="py-6 text-center text-sm text-fg-tertiary">Loading discussion…</p>;
  if (error) return <p className="py-6 text-center text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      {/* Open questions callout */}
      <OpenQuestionsBar entries={entries} />

      {/* Add entry */}
      <DiscussionEntryForm onSubmit={handleCreate} />

      {/* Filter bar */}
      {entries.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={clsx(
              'rounded-full border px-3 py-1 text-xs font-medium transition-all',
              filter === 'all'
                ? 'border-fg bg-fg text-bg'
                : 'border-border bg-surface text-fg-secondary hover:bg-surface-tertiary',
            )}
          >
            All ({entries.length})
          </button>
          {ENTRY_TYPES.map(t => {
            const count = entries.filter(e => e.type === t).length;
            if (count === 0) return null;
            const meta = ENTRY_TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  filter === t
                    ? `${meta.bgColor} ${meta.color} ${meta.borderColor}`
                    : 'border-border bg-surface text-fg-secondary hover:bg-surface-tertiary',
                )}
              >
                {meta.label} ({count})
              </button>
            );
          })}
          {pinnedCount > 0 && (
            <span className="ml-auto text-xs text-fg-muted">{pinnedCount} pinned</span>
          )}
        </div>
      )}

      {/* Entries */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-sm text-fg-muted">
            {entries.length === 0
              ? 'No discussion entries yet. Log the first meeting or note above.'
              : `No ${filter} entries.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(entry => (
            <DiscussionEntryCard
              key={entry._id}
              entry={entry}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 10.2: Commit**

```bash
git add frontend/src/components/discussion/discussion-board.tsx
git commit -m "feat(discussion): add DiscussionBoard orchestrator component"
```

---

## Task 11: Frontend — Add Discussion Tab to Opportunity Detail Page

**Files:**
- Modify: `frontend/src/app/(app)/opportunities/[id]/page.tsx`

- [ ] **Step 11.1: Add the Discussion tab definition**

In `page.tsx`, find this block:

```typescript
const tabs = [
  { id: 'intake', label: 'Intake', icon: ListChecks },
  { id: 'review', label: 'Review', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Clock3 },
] as const;
```

Replace with:

```typescript
const tabs = [
  { id: 'intake',      label: 'Intake',      icon: ListChecks  },
  { id: 'review',      label: 'Review',       icon: FileText    },
  { id: 'discussion',  label: 'Discussion',   icon: MessageSquare },
  { id: 'activity',    label: 'Activity',     icon: Clock3      },
] as const;
```

- [ ] **Step 11.2: Add the MessageSquare import**

Find the lucide-react import line:
```typescript
import { ArrowRight, Clock3, FileText, ListChecks } from 'lucide-react';
```

Replace with:
```typescript
import { ArrowRight, Clock3, FileText, ListChecks, MessageSquare } from 'lucide-react';
```

- [ ] **Step 11.3: Add the DiscussionBoard import**

Add after the existing component imports (after the `useAuth` import):
```typescript
import { DiscussionBoard } from '@/components/discussion/discussion-board';
```

- [ ] **Step 11.4: Add the Discussion tab panel**

Find this block (the activity tab render, inside the JSX where tabs render their content):

```tsx
{activeTab === 'activity' && (
```

Add the discussion panel before it:

```tsx
{activeTab === 'discussion' && opportunity && user && (
  <DiscussionBoard
    opportunityId={opportunity._id}
    currentUserId={user.id || user._id || ''}
    currentUserRole={user.role || ''}
  />
)}
```

- [ ] **Step 11.5: Verify TypeScript compiles**

```bash
cd .worktrees/feature-phase1-discussion-board/frontend
npx tsc --noEmit 2>&1 | grep error | head -20
```

Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 11.6: Commit**

```bash
git add frontend/src/app/\(app\)/opportunities/\[id\]/page.tsx
git add frontend/src/components/discussion/
git commit -m "feat(discussion): add Discussion tab to opportunity detail page"
```

---

## Task 12: End-to-End Manual Test

With both servers running (`./dev.sh` from project root):

- [ ] **Step 12.1: Start servers**

```bash
# From the WORKTREE root (not the main repo)
cd .worktrees/feature-phase1-discussion-board
./dev.sh
```

- [ ] **Step 12.2: Reset database and seed users**

```bash
./reset-db.sh
```

- [ ] **Step 12.3: Test as Sales user (sarah@machineiq.com)**

1. Log in at `http://localhost:4050`
2. Create a new Opportunity (Opportunities → New)
3. Open the opportunity → click **Discussion** tab
4. Click "Log a meeting, call, email, note or question"
5. Select type **Meeting**, set date, add notes in rich text, add external participant "Jane Smith (Nestlé)"
6. Click **Add Entry** — entry appears in the timeline
7. Add a second entry of type **Question**, check "Mark as open question"
8. Verify the **Open question** callout appears at the top with count
9. Click the resolve (✓) button on the question entry → add resolution text → click "Mark Resolved"
10. Verify the question shows as resolved with the resolution text

- [ ] **Step 12.4: Test as PM (james@machineiq.com)**

1. Log in as james@machineiq.com
2. Open the same opportunity
3. Verify PM can see all entries
4. Pin an entry (click 📌) — verify the "Pinned" badge appears
5. Verify PM can delete entries not authored by them

- [ ] **Step 12.5: Test filter bar**

1. Add entries of different types (meeting, call, email, decision)
2. Click each filter button — verify only matching entries show
3. Click "All" — verify all entries show

- [ ] **Step 12.6: Run backend tests one final time**

```bash
cd .worktrees/feature-phase1-discussion-board/backend
npx jest --no-coverage
```

Expected: All 45 tests passing (36 original + 9 new discussion service tests)

- [ ] **Step 12.7: Final commit**

```bash
git add -A
git status  # verify nothing unexpected is staged
git commit -m "feat(discussion): phase 1 discussion board complete and tested"
```

---

## Task 13: Push branch for review

- [ ] **Step 13.1: Push the feature branch**

```bash
git push -u origin feature/phase1-discussion-board
```

- [ ] **Step 13.2: Verify on GitHub**

Open `https://github.com/bala177/machineiq` and confirm the branch appears with all commits.

---

## Summary

When this plan is complete, the Opportunity detail page will have a Discussion tab with:

- ✅ Timeline feed of entries (meeting, call, email, note, question, decision)
- ✅ Rich text editor (bold, italic, bullet lists, numbered lists)
- ✅ External participant names (customer contacts not in the system)
- ✅ Open question tracking with resolution workflow
- ✅ Pin entries as key decisions
- ✅ Filter by entry type
- ✅ Author-gated edit/delete permissions (PM and admin can edit any)
- ✅ 9 backend unit tests covering happy paths + security guards
