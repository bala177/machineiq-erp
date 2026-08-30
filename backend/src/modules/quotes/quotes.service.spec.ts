import { BadRequestException } from '@nestjs/common';
import { QuoteStatus } from '../../common/enums';
import { DatabaseId } from '../../database/postgres-document.types';
import { QuotesService } from './quotes.service';

describe('QuotesService', () => {
  describe('calculateTotals', () => {
    it('calculates subtotal, discount, tax, and grand total', () => {
      const result = QuotesService.calculateTotals([
        { description: 'Machine', quantity: 2, unitPrice: 1000, discountPercent: 10, taxPercent: 18 },
        { description: 'Service', quantity: 1, unitPrice: 500, discountPercent: 0, taxPercent: 0 },
      ]);

      expect(result.subtotal).toBe(2500);
      expect(result.discountTotal).toBe(200);
      expect(result.taxTotal).toBe(324);
      expect(result.grandTotal).toBe(2624);
      expect(result.lineItems[0].lineTotal).toBe(2124);
    });

    it('requires at least one line item', () => {
      expect(() => QuotesService.calculateTotals([])).toThrow(BadRequestException);
    });
  });

  describe('status and conversion rules', () => {
    const makeService = (quote: any) => {
      const quoteModel = {
        findOne: jest.fn().mockResolvedValue(quote),
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      const projectModel = {
        create: jest.fn().mockResolvedValue({ _id: new DatabaseId(), projectNo: 'PRJ-2026-0001' }),
        findOne: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        }),
      };
      const opportunityModel = {
        updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      };
      const service = new QuotesService(
        quoteModel as any,
        {} as any,
        opportunityModel as any,
        projectModel as any,
        { log: jest.fn().mockResolvedValue(undefined) } as any,
        { get: jest.fn().mockResolvedValue({ value: {} }) } as any,
        { generate: jest.fn().mockResolvedValue('QTE-2026-0001') } as any,
      );
      jest.spyOn(service, 'findById').mockResolvedValue({ ...quote, _id: String(quote._id) } as any);
      return { service, quoteModel, projectModel };
    };

    it('blocks invalid status transitions', async () => {
      const { service } = makeService({ _id: new DatabaseId(), status: QuoteStatus.DRAFT, deletedAt: null });

      await expect(service.updateStatus(new DatabaseId().toString(), { status: QuoteStatus.ACCEPTED }, { userId: 'u1', role: 'sales' }))
        .rejects.toThrow(BadRequestException);
    });

    it('converts only accepted quotes to a project once', async () => {
      const quote = {
        _id: new DatabaseId(),
        quoteNo: 'QTE-2026-0001',
        status: QuoteStatus.ACCEPTED,
        customerId: new DatabaseId(),
        opportunityId: new DatabaseId(),
        convertedProjectId: null,
        currency: 'INR',
        subtotal: 100,
        discountTotal: 0,
        taxTotal: 18,
        grandTotal: 118,
        lineItems: [{ description: 'Machine', quantity: 1, unitPrice: 100, lineTotal: 118 }],
        deletedAt: null,
      };
      const { service, projectModel, quoteModel } = makeService(quote);

      const result = await service.convertToProject(new DatabaseId().toString(), {
        name: 'Accepted quote project',
        projectManagerId: new DatabaseId().toString(),
      }, 'u1');

      expect(projectModel.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Accepted quote project',
        sourceQuoteId: quote._id,
        commercialSnapshot: expect.objectContaining({ quoteNo: quote.quoteNo, grandTotal: 118 }),
      }));
      expect(quoteModel.updateOne).toHaveBeenCalledWith({ _id: quote._id }, expect.objectContaining({ $set: expect.any(Object) }));
      expect(result.project.projectNo).toBe('PRJ-2026-0001');
    });

    it('prevents converting a quote twice', async () => {
      const { service } = makeService({
        _id: new DatabaseId(),
        status: QuoteStatus.ACCEPTED,
        convertedProjectId: new DatabaseId(),
        deletedAt: null,
      });

      await expect(service.convertToProject(new DatabaseId().toString(), {
        name: 'Duplicate conversion',
        projectManagerId: new DatabaseId().toString(),
      }, 'u1')).rejects.toThrow(BadRequestException);
    });
  });
});
