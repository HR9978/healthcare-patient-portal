export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface Invoice {
  id: string;
  /** Decimal values arrive from the API as strings, e.g. "120". */
  amount: string;
  status: InvoiceStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  patient: { user: { firstName: string; lastName: string } };
  appointment: {
    id: string;
    status: string;
    startsAt: string;
    doctor: {
      specialty: { name: string };
      user: { firstName: string; lastName: string };
    };
  } | null;
}
