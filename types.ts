export enum MetalType {
  ALUMINUM = 'Aluminum',
  STEEL = 'Steel',
  BOTH = 'Both',
  UNKNOWN = 'Unknown'
}

export interface DerivativeMatch {
  derivativeCategory: string;
  metalType: MetalType;
  matchDetail: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface HeadingInfo {
  heading: string;
  description: string;
  details?: string;
}

export interface AnalysisResult {
  found: boolean;
  matches: DerivativeMatch[];
  reasoning: string;
}

export interface ProvisionResult {
  found: boolean;
  code: string;
  metalType: string;
  description: string;
}

export interface DocumentContext {
  type: 'text' | 'file';
  content: string; // Plain text or Base64 string
  mimeType?: string; // e.g., 'application/pdf'
  name: string;
  extractedHeadings?: HeadingInfo[];
}

export interface ManualEntry {
  id: string;
  code: string;
  description: string;
  category: string;
  metalType: MetalType;
}