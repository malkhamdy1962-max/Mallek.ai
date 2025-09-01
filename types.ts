export type StructuredResponse = {
  executiveSummary: string;
  keyPoints: string[];
  detailedAnalysis: string;
  sources: { title: string; link: string }[];
  suggestedQuestions: string[];
};

export type TaskPlanStep = {
  step: number;
  title: string;
  description: string;
  completed: boolean;
};

export type CaseFile = string;
export type UserProfile = string; // A string summarizing user preferences

export type Message = {
  id: number; // Unique identifier for each message
  role: 'user' | 'model';
  text: string; // Keep for user messages and simple text fallbacks
  responseObject?: StructuredResponse; // For structured AI responses
  taskPlan?: TaskPlanStep[]; // For the strategic planner's output
  imageData?: string; // Base64 encoded image data
  imageType?: string; // Mime type of the image
  feedback?: 'like' | 'dislike' | null; // For user feedback
  statusHistory?: string[]; // For live status updates from the agent
};

export type UserInput = {
    text: string;
    image?: {
        data: string; // Base64 encoded string
        mimeType: string;
    } | null;
};

// FIX: Add discriminated union for workflow stream chunks to enable type-safe handling in the UI.
export type WorkflowStreamChunk =
  | { type: 'status'; message: string }
  | { type: 'response'; data: StructuredResponse }
  | { type: 'final'; updatedCaseFile: string; updatedUserProfile: string };
