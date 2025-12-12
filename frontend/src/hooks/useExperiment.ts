/**
 * useExperiment - A/B Testing Hook
 * 
 * Provides deterministic experiment variant assignment.
 * Variants are assigned based on visitor_id for consistency.
 */

import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/utils/constants'

interface ExperimentResult {
  variant: string
  inExperiment: boolean
  loading: boolean
}

// Cache assignments to avoid repeated API calls
const assignmentCache = new Map<string, { variant: string; inExperiment: boolean }>()

// Get visitor ID from localStorage
const getVisitorId = (): string => {
  const key = 'analytics_visitor_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `v_${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(key, id)
  }
  return id
}

const getSessionId = (): string => {
  const key = 'analytics_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = `s_${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    sessionStorage.setItem(key, id)
  }
  return id
}

export function useExperiment(experimentName: string): ExperimentResult {
  const [result, setResult] = useState<ExperimentResult>({
    variant: 'control',
    inExperiment: false,
    loading: true,
  })

  useEffect(() => {
    // Check cache first
    const cached = assignmentCache.get(experimentName)
    if (cached) {
      setResult({ ...cached, loading: false })
      return
    }

    const fetchAssignment = async () => {
      try {
        const visitorId = getVisitorId()
        const sessionId = getSessionId()

        const res = await fetch(`${API_BASE}/analytics/enterprise/experiment/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experiment_name: experimentName,
            visitor_id: visitorId,
            session_id: sessionId,
          }),
        })

        const data = await res.json()
        
        if (data.success) {
          const assignment = {
            variant: data.data.variant,
            inExperiment: data.data.in_experiment,
          }
          assignmentCache.set(experimentName, assignment)
          setResult({ ...assignment, loading: false })
        } else {
          setResult({ variant: 'control', inExperiment: false, loading: false })
        }
      } catch {
        setResult({ variant: 'control', inExperiment: false, loading: false })
      }
    }

    fetchAssignment()
  }, [experimentName])

  return result
}

/**
 * Track conversion for an experiment
 */
export function useExperimentConversion() {
  const trackConversion = useCallback(async (
    experimentName: string,
    conversionValue?: number
  ) => {
    try {
      const visitorId = getVisitorId()

      await fetch(`${API_BASE}/analytics/enterprise/experiment/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_name: experimentName,
          visitor_id: visitorId,
          conversion_value: conversionValue,
        }),
      })
    } catch {
      // Silent fail
    }
  }, [])

  return { trackConversion }
}

/**
 * Simple variant selector component helper
 */
export function useVariant<T>(
  experimentName: string,
  variants: Record<string, T>,
  defaultVariant: T
): { value: T; loading: boolean; variant: string } {
  const { variant, loading } = useExperiment(experimentName)
  
  return {
    value: variants[variant] ?? defaultVariant,
    loading,
    variant,
  }
}
