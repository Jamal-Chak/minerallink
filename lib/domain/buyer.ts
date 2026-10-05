export type BuyerVerificationStatus =
  | "UNVERIFIED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED";

export interface BuyerContact {
  id: string;
  name: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

export interface Buyer {
  id: string;
  companyName: string;
  country: string;
  website?: string;

  verificationStatus: BuyerVerificationStatus;

  contacts: BuyerContact[];
  notes?: string;

  createdAt: string;
  updatedAt: string;
}
