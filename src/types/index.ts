export interface Transaction {
  date: string;
  description: string;
  type: 'CR' | 'DB';
  amount: number;
}

export interface ChunkData {
  transactions: Transaction[];
  startDate: string;
  endDate: string;
  totalCredit: number;
  totalDebit: number;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}