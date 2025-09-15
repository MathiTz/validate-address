export type ValidationStatus = 'valid' | 'corrected' | 'unverifiable';

export interface ValidatedAddress {
  streetNumber: string | null;
  streetName: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  formatted: string;
}

export interface AddressValidationResult {
  status: ValidationStatus;
  confidence: number;
  original: string;
  validated: ValidatedAddress | null;
  corrections?: string[];
}

export interface AddressRequest {
  address: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface ServiceInfo {
  service: string;
  version: string;
  endpoints: Record<string, string>;
}