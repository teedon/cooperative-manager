export enum OrganizationType {
  COOPERATIVE = 'cooperative', // Direct cooperative (current model)
  MANAGER = 'manager', // Cooperative management business
}

export enum CollectionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_POSTED = 'partially_posted',
}

export enum CollectionTransactionStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  REJECTED = 'rejected',
  FAILED = 'failed',
}

export enum CollectionTransactionType {
  CONTRIBUTION = 'contribution',
  LOAN_REPAYMENT = 'loan_repayment',
  AJO_PAYMENT = 'ajo_payment',
  ESUSU_CONTRIBUTION = 'esusu_contribution',
  SHARE_PURCHASE = 'share_purchase',
}
