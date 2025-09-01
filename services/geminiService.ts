import { type Message, type StructuredResponse, type UserInput, type CaseFile, type TaskPlanStep, type UserProfile, type WorkflowStreamChunk } from '../types';

// Helper function to call our new secure API proxy
async function callProxyAPI<T>(endpoint: string, body: object): Promise<T> {
  const response = await fetch(`/api/proxy?endpoint=${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(errorBody.error || 'Failed to fetch from API proxy');
  }
  return response.json() as T;
}

// Helper for streaming from the proxy
async function* streamProxyAPI(endpoint: string, body: object): AsyncGenerator<any> {
    const response = await fetch(`/api/proxy?endpoint=${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to fetch streaming from API proxy');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        // Decode and process the chunk
        const chunkStr = decoder.decode(value, { stream: true });
        // Assuming chunks are newline-separated JSON objects
        const jsonChunks = chunkStr.split('\n').filter(s => s.trim());
        for (const jsonChunk of jsonChunks) {
            try {
                yield JSON.parse(jsonChunk);
            } catch (e) {
                console.error("Failed to parse stream chunk:", jsonChunk);
            }
        }
    }
}


export const summarizeTextWorkflow = async (textToSummarize: string): Promise<string> => {
    return await callProxyAPI<string>('summarize', { textToSummarize });
};

export const planTaskWorkflow = async (masterInstruction: string, caseFile: CaseFile, userProfile: UserProfile): Promise<TaskPlanStep[]> => {
    return await callProxyAPI<TaskPlanStep[]>('plan', { masterInstruction, caseFile, userProfile });
}

export async function* runLegalAgentWorkflow(userInput: UserInput, masterInstruction: string, history: Message[], caseFile: CaseFile, userProfile: UserProfile): AsyncGenerator<WorkflowStreamChunk> {
    const body = {
        userInput,
        masterInstruction,
        history,
        caseFile,
        userProfile
    };
    yield* streamProxyAPI('workflow', body);
};
