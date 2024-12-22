import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { ChunkData, AnalysisResult } from '../types';

export class OpenAIService {
  private client: OpenAIClient;
  private endpoint: string;
  private deploymentName: string;

  constructor(apiKey: string, endpoint: string, deploymentName: string) {
    this.client = new OpenAIClient(endpoint, new AzureKeyCredential(apiKey));
    this.endpoint = endpoint;
    this.deploymentName = deploymentName;
  }

  async analyzeChunk(chunk: ChunkData, previousSummary?: string): Promise<string> {
    const prompt = `Analyze this bank statement chunk:
    Period: ${chunk.startDate} to ${chunk.endDate}
    Total Credits: ${chunk.totalCredit}
    Total Debits: ${chunk.totalDebit}
    ${previousSummary ? `Previous Analysis Context: ${previousSummary}` : ''}
    
    Transactions in JSON String format: 
    ${JSON.stringify(chunk.transactions.slice(0, 75))}
    
    Provide insights about:
    1. spending patterns
    2. income sources
    3. Use NLP technique to identify individual or company name, exclude any character that is not letter, then analyze top 5 based of total amount money in group by the company or individual and top 5 total amount money out group by company or individual. Provide also output the total amount you calculated.
    4. financial behavior
    5. analyze potential window dressing or financial engineering transactions.`;

    const messages = [
      {
        role: 'system',
        content: `You are a financial analyst assistant on the largest bank in Indonesia. Provide concise insights.

          Rules:
          * Do not hallucinate.
          * Do not use the internet.
          * Use only the information provided.
          * Write only in English.
          * Accuracy is the top priority.
          * The bank statements is in Indonesia Language.
          * type column contains value CR and DB. CR means money in, DB means money out.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];
    
    const response = await this.client.getChatCompletions(
      this.deploymentName,
      messages,
      { maxTokens: 2000, temperature: 0 }
    );
    console.log(response)
    return response.choices[0]?.message?.content;
  }

  async generateFinalAnalysis(allSummaries: string[]): Promise<AnalysisResult> {
    const prompt = `Based on all the following chunk analyses, provide a comprehensive financial analysis:
    ${allSummaries.join('\n')}
    
    Include:
    1. Overall financial health summary
    2. Key spending patterns and trends
    3. Income stability analysis
    4. Top 5 individual or company name for money in and money out
    5. overall potential window dressing or financial engineering analysis
    6. Recommendations for bank to make credit decisions`;

    const messages = [
      {
        role: 'system',
        content: `You are a financial analyst assistant on the largest bank in Indonesia. Provide concise insights.

          Rules:
          * Do not hallucinate.
          * Do not use the internet.
          * Use only the information provided.
          * Write only in English.
          * Accuracy is the top priority.
          * The bank statements is in Indonesia Language.
          * type column contains value CR and DB. CR means money in, DB means money out.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.client.getChatCompletions(
      this.deploymentName,
      messages,
      { maxTokens: 2000, temperature: 0 }
    );
  
    // Parse the response into structured format
    const analysis = response.choices[0]?.message?.content;
    console.log(response)
    return {
      summary: analysis.split('\n')[0],
      insights: analysis.match(/- (.*)/g)?.map(i => i.slice(2)) || [],
      recommendations: analysis.match(/\d\. (.*)/g)?.map(r => r.slice(3)) || [],
      final: analysis,
      allSummaries: allSummaries
    };
  }
}