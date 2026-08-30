import { BadRequestException } from '@nestjs/common';
import { InvoiceStatus, QuoteStatus } from '../../common/enums';
import { DatabaseId } from '../../database/postgres-document.types';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  const makeService = (quote: any, existingInvoice: any = null) => {
    const invoiceModel = {
      create: jest.fn().mockResolvedValue({ _id: new DatabaseId(), invoiceNo: 'INV-2026-0001' }),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockResolvedValue(0),
    } as any;
    invoiceModel.findOne
      .mockResolvedValueOnce(existingInvoice)
      .mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

    const quoteModel = {
      findOne: jest.fn().mockResolvedValue(quote),
    };
    const projectModel = {
      findOne: jest.fn().mockResolvedValue(null),
    };
    const service = new InvoicesService(
      invoiceModel as any,
      quoteModel as any,
      projectModel as any,
      { log: jest.fn().mockResolvedValue(undefined) } as any,
      { generate: jest.fn().mockResolvedValue('INV-2026-0001') } as any,
    );
    jest.spyOn(service, 'findById').mockResolvedValue({ invoiceNo: 'INV-2026-0001' } as any);
    return { service, invoiceModel };
  };

  it('creates a draft invoice only from an accepted quote', async () => {
    const quote = {
      _id: new DatabaseId(),
      status: QuoteStatus.ACCEPTED,
      customerId: new DatabaseId(),
      convertedProjectId: null,
      currency: 'INR',
      customerSnapshot: { name: 'Customer' },
      lineItems: [{ description: 'Machine', quantity: 1, unitPrice: 100, lineTotal: 118 }],
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 18,
      shippingCharge: 0,
      adjustment: 0,
      grandTotal: 118,
      deletedAt: null,
    };
    const { service, invoiceModel } = makeService(quote);

    await service.createFromQuote(new DatabaseId().toString(), {}, 'u1');

    expect(invoiceModel.create).toHaveBeenCalledWith(expect.objectContaining({
      sourceQuoteId: quote._id,
      status: InvoiceStatus.DRAFT,
      grandTotal: 118,
      balanceDue: 118,
    }));
  });

  it('rejects invoices for quotes that are not accepted', async () => {
    const { service } = makeService({ _id: new DatabaseId(), status: QuoteStatus.SENT, deletedAt: null });

    await expect(service.createFromQuote(new DatabaseId().toString(), {}, 'u1')).rejects.toThrow(BadRequestException);
  });
});
