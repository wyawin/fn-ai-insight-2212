import { Transaction, ChunkData } from '../types';

const CHUNK_SIZE = 75; // Adjust based on Azure OpenAI token limits

export const createChunks = (transactions: Transaction[]): ChunkData[] => {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chunks: ChunkData[] = [];
  
  for (let i = 0; i < sortedTransactions.length; i += CHUNK_SIZE) {
    const chunkTransactions = sortedTransactions.slice(i, i + CHUNK_SIZE);
    
    const totalCredit = chunkTransactions
      .filter(t => t.type === 'CR')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalDebit = chunkTransactions
      .filter(t => t.type === 'DB')
      .reduce((sum, t) => sum + t.amount, 0);

    chunks.push({
      transactions: chunkTransactions,
      startDate: chunkTransactions[0].date,
      endDate: chunkTransactions[chunkTransactions.length - 1].date,
      totalCredit,
      totalDebit
    });
  }

  return chunks;
};