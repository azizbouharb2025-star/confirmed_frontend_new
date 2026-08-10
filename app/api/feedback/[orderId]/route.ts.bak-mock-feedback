/**
 * Feedback API Route - Get feedback for a specific order
 * GET /api/feedback/:orderId
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.6
 */

import { NextRequest, NextResponse } from 'next/server';
import type { HumanFeedback, AIFeedback } from '@/types/feedback';

/**
 * Mock data generator for human feedback
 */
function generateMockHumanFeedback(orderId: string): HumanFeedback[] {
  const operators = [
    { id: '1', name: 'Ahmed Ben Ali', avatar: undefined },
    { id: '2', name: 'Fatma Trabelsi', avatar: undefined },
    { id: '3', name: 'Mohamed Gharbi', avatar: undefined },
  ];

  const commonTags = [
    'polite customer',
    'price concern',
    'quality question',
    'delivery inquiry',
    'payment issue',
    'product details',
    'urgent request',
    'satisfied customer',
  ];

  const notes = [
    'Customer was very polite and confirmed the order immediately.',
    'Customer asked about delivery time and expressed concern about price.',
    'Customer had questions about product quality but confirmed after explanation.',
    'Customer requested faster delivery option.',
    'Very satisfied customer, repeat buyer.',
  ];

  // Generate 1-2 human feedback entries
  const count = Math.random() > 0.5 ? 2 : 1;
  const feedback: HumanFeedback[] = [];

  for (let i = 0; i < count; i++) {
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const selectedTags = commonTags
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 1);

    feedback.push({
      _id: `human-${orderId}-${i}`,
      orderId,
      operatorId: operator.id,
      operatorName: operator.name,
      operatorAvatar: operator.avatar,
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
      tags: selectedTags,
      notes: notes[Math.floor(Math.random() * notes.length)],
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source: 'human',
    });
  }

  return feedback;
}

/**
 * Mock data generator for AI feedback
 */
function generateMockAIFeedback(orderId: string): AIFeedback[] {
  const aiTags = [
    'high risk',
    'medium risk',
    'low risk',
    'suspicious pattern',
    'repeat buyer',
    'new customer',
    'high value order',
    'unusual location',
    'verified phone',
  ];

  const riskFactors = [
    'First-time buyer',
    'High order value',
    'Unusual delivery location',
    'Late night order',
    'Multiple failed attempts',
    'Verified customer history',
    'Consistent order pattern',
  ];

  const reasoning = [
    'Order shows normal patterns consistent with verified customer behavior.',
    'Customer has a strong purchase history with no previous issues.',
    'Order value is higher than average, recommend verification call.',
    'New customer with limited history, standard verification recommended.',
    'Customer location matches previous successful deliveries.',
  ];

  // Generate 1 AI feedback entry
  const selectedTags = aiTags
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 2);

  const selectedRiskFactors = riskFactors
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 1);

  return [
    {
      _id: `ai-${orderId}-0`,
      orderId,
      confidenceScore: Math.floor(Math.random() * 30) + 70, // 70-100
      tags: selectedTags,
      reasoning: reasoning[Math.floor(Math.random() * reasoning.length)],
      riskFactors: selectedRiskFactors,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      source: 'ai',
    },
  ];
}

/**
 * GET /api/feedback/:orderId
 * Returns both human and AI feedback for a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with real database queries
    // const humanFeedback = await db.humanFeedback.find({ orderId });
    // const aiFeedback = await db.aiFeedback.find({ orderId });

    // For now, use mock data
    const humanFeedback = generateMockHumanFeedback(orderId);
    const aiFeedback = generateMockAIFeedback(orderId);

    return NextResponse.json({
      humanFeedback,
      aiFeedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
