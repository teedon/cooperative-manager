import apiClient from './client';

export interface PendingRepayment {
  id: string;
  loanId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  receiptNumber?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  submitter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  loan: {
    id: string;
    amount: number;
    status: string;
    member: {
      id: string;
      user?: {
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    loanType?: {
      name: string;
    };
  };
}

export const getPendingRepayments = async (cooperativeId: string): Promise<PendingRepayment[]> => {
  const response = await apiClient.get(`/cooperatives/${cooperativeId}/loans/pending-repayments`);
  return response.data.data;
};

export const confirmRepayment = async (repaymentId: string): Promise<any> => {
  const response = await apiClient.post(`/repayments/${repaymentId}/confirm`);
  return response.data.data;
};

export const rejectRepayment = async (repaymentId: string, reason: string): Promise<any> => {
  const response = await apiClient.post(`/repayments/${repaymentId}/reject`, { reason });
  return response.data.data;
};
