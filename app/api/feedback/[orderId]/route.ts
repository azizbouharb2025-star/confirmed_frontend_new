import { NextResponse } from 'next/server'

/**
 * No mock feedback must be exposed in production.
 *
 * Real per-order feedback will be returned here once the backend endpoint
 * is implemented. Until then, return empty collections so the interface
 * displays only verified information.
 */
export async function GET() {
  return NextResponse.json({
    humanFeedback: [],
    aiFeedback: [],
  })
}
