// Shared types used across all Parable applications

export interface User {
  id: string
  email: string
  name: string
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  createdAt: string
}

export interface Signal {
  id: string
  name: string
  type: 'continuous' | 'categorical' | 'ordinal' | 'boolean'
  source: string
  unit?: string
  description?: string
}

export interface NormalizedEvent {
  eventId: string
  userId: string
  signalId: string
  timestamp: string
  value: number
  valueType: string
  confidence: number
  metadata?: Record<string, unknown>
}

export type ConfidenceTier = 'Emerging' | 'Established' | 'Strong' | 'Proven'

export interface Finding {
  findingId: string
  userId: string
  signalA: string
  signalB: string
  relationship: 'causal' | 'associative' | 'spurious'
  direction: 'positive' | 'negative' | 'nonlinear'
  effectSize: number
  confidenceTier: ConfidenceTier
  sampleSize: number
  pValue: number | null
  lagDays: number
  confoundsChecked: string[]
  confoundsRuledOut: string[]
  naturalLanguage: string
  generatedAt: string
}

export interface CausalGraph {
  id: string
  userId: string
  nodes: string[]
  edges: Array<[string, string]>
  edgeConfidences: Record<string, number>
  algorithm: string
  generatedAt: string
}

export interface IngestResponse {
  success: boolean
  recordsIngested: number
  signalsDetected: string[]
}

export interface DiscoverResponse {
  graph: CausalGraph
  nodes: number
  edges: number
}

export interface ApiError {
  error: string
  detail: string
  statusCode: number
}
