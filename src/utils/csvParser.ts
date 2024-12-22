import Papa from 'papaparse';
import { Transaction } from '../types';

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      delimiter: ";",
      dynamicTyping: true,
      complete: (results) => {
        const transactions = results.data
          .filter((row: any) => row.date && row.amount)
          .map((row: any) => ({
            date: row.date,
            description: row.description,
            type: row.type,
            amount: parseFloat(row.amount)
          }));
        resolve(transactions);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};