/**
 * Feedback Types - Human and AI Operator Feedback
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

/**
 * Feedback source type
 */
export type FeedbackSource = 'human' | 'ai';

/**
 * Human operator feedback on an order
 * Includes operator details, rating, tags, and notes
 */
export interface HumanFeedback {
  _id: string;
  orderId: string;
  operatorId: string;
  operatorName: string;
  operatorAvatar?: string;
  rating: number; // 1-5
  tags: string[]; // e.g., "polite customer", "price concern", "quality question"
  notes: string;
  timestamp: string;
  source: 'human';
}

/**
 * AI-generated feedback on an order
 * Includes confidence score, automated tags, and reasoning
 */
export interface AIFeedback {
  _id: string;
  orderId: string;
  confidenceScore: number; // 0-100
  tags: string[]; // e.g., "high risk", "suspicious pattern", "repeat buyer"
  reasoning: string; // AI explanation
  riskFactors: string[];
  timestamp: string;
  source: 'ai';
}

/**
 * Union type for all feedback types
 */
export type Feedback = HumanFeedback | AIFeedback;

/**
 * Operator feedback summary data for analytics
 */
export interface OperatorFeedbackSummaryData {
  totalFeedback: number;
  averageRating: number;
  topTags: Array<{ tag: string; count: number }>;
  trendData: Array<{ date: string; averageRating: number; count: number }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Type guard to check if feedback is human feedback
 */
export function isHumanFeedback(feedback: Feedback): feedback is HumanFeedback {
  return feedback.source === 'human';
}

/**
 * Type guard to check if feedback is AI feedback
 */
export function isAIFeedback(feedback: Feedback): feedback is AIFeedback {
  return feedback.source === 'ai';
}
