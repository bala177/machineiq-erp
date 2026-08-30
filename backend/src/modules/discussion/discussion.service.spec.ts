import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import { DiscussionEntry } from '../../schemas/discussion.schema';
import { DiscussionEntryType } from '../../common/enums';
import { DatabaseId } from '../../database/postgres-document.types';
import { getPgModelToken } from '../../database/postgres-document.module';

const mockUserId = new DatabaseId().toHexString();
const mockOpportunityId = new DatabaseId().toHexString();
const mockEntryId = new DatabaseId().toHexString();

const mockEntry = {
  _id: mockEntryId,
  opportunityId: mockOpportunityId,
  type: DiscussionEntryType.NOTE,
  content: '<p>Test note</p>',
  authorId: mockUserId,
  participants: [],
  externalParticipants: [],
  date: new Date(),
  isOpenQuestion: false,
  isPinned: false,
  attachments: [],
  deletedAt: null,
};

const mockModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

function populatedExecQuery<T>(value: T) {
  return {
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value),
  };
}

describe('DiscussionService', () => {
  let service: DiscussionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscussionService,
        { provide: getPgModelToken(DiscussionEntry.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<DiscussionService>(DiscussionService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a discussion entry', async () => {
      mockModel.create.mockResolvedValue(mockEntry);
      mockModel.findById.mockReturnValue(populatedExecQuery(mockEntry));
      const dto = {
        type: DiscussionEntryType.NOTE,
        content: '<p>Test note</p>',
        date: new Date().toISOString(),
      };
      const result = await service.create(mockOpportunityId, mockUserId, dto as any);
      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          opportunityId: expect.any(Object),
          authorId: expect.any(Object),
          type: DiscussionEntryType.NOTE,
          content: '<p>Test note</p>',
        }),
      );
      expect(result).toEqual(mockEntry);
    });
  });

  describe('findAll', () => {
    it('should return entries for an opportunity', async () => {
      const mockExec = jest.fn().mockResolvedValue([mockEntry]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockModel.find.mockReturnValue({ populate: mockPopulate1 });

      const result = await service.findAll(mockOpportunityId);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ opportunityId: expect.any(Object), deletedAt: null }),
      );
      expect(result).toEqual([mockEntry]);
    });

    it('should filter by openQuestions when flag is true', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
      mockModel.find.mockReturnValue({ populate: mockPopulate1 });

      await service.findAll(mockOpportunityId, true);
      expect(mockModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ isOpenQuestion: true, resolvedAt: null }),
      );
    });
  });

  describe('update', () => {
    it('should update an entry when user is the author', async () => {
      const entryWithAuthor = { ...mockEntry, authorId: { toHexString: () => mockUserId } };
      mockModel.findById.mockResolvedValue(entryWithAuthor);
      mockModel.findByIdAndUpdate.mockReturnValue(populatedExecQuery({ ...entryWithAuthor, isPinned: true }));

      const result = await service.update(mockEntryId, mockUserId, { isPinned: true } as any);
      expect(result).toMatchObject({ isPinned: true });
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      mockModel.findById.mockResolvedValue(null);
      await expect(service.update(mockEntryId, mockUserId, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const differentUserId = new DatabaseId().toHexString();
      const entryWithAuthor = { ...mockEntry, authorId: { toHexString: () => differentUserId } };
      mockModel.findById.mockResolvedValue(entryWithAuthor);
      await expect(service.update(mockEntryId, mockUserId, {} as any)).rejects.toThrow(ForbiddenException);
    });

    it('should set resolvedAt when resolving a question', async () => {
      const questionEntry = { ...mockEntry, type: DiscussionEntryType.QUESTION, isOpenQuestion: true, authorId: { toHexString: () => mockUserId } };
      mockModel.findById.mockResolvedValue(questionEntry);
      mockModel.findByIdAndUpdate.mockReturnValue(populatedExecQuery({ ...questionEntry, isOpenQuestion: false, resolvedAt: new Date() }));

      await service.update(mockEntryId, mockUserId, { isOpenQuestion: false, resolution: 'Fixed' } as any);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEntryId,
        expect.objectContaining({ $set: expect.objectContaining({ resolvedAt: expect.any(Date) }) }),
        { new: true },
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete an entry when user is the author', async () => {
      const entryWithAuthor = { ...mockEntry, authorId: { toHexString: () => mockUserId } };
      mockModel.findById.mockResolvedValue(entryWithAuthor);
      mockModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.remove(mockEntryId, mockUserId);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockEntryId,
        { $set: { deletedAt: expect.any(Date) } },
      );
      expect(result).toEqual({ message: 'Entry deleted' });
    });

    it('should throw NotFoundException when entry does not exist', async () => {
      mockModel.findById.mockResolvedValue(null);
      await expect(service.remove(mockEntryId, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      const differentUserId = new DatabaseId().toHexString();
      const entryWithAuthor = { ...mockEntry, authorId: { toHexString: () => differentUserId } };
      mockModel.findById.mockResolvedValue(entryWithAuthor);
      await expect(service.remove(mockEntryId, mockUserId)).rejects.toThrow(ForbiddenException);
    });
  });
});
