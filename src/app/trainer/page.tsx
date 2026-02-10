'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatDate } from '@/lib/garmin-parser'
import type { Workout, WorkoutPlan } from '@/lib/database.types'

export default function TrainerPage() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'plans'>('workouts')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(false)
  
  // Filters
  const [activityType, setActivityType] = useState('')
  const [minDistance, setMinDistance] = useState('')
  const [maxDistance, setMaxDistance] = useState('')
  const [limit, setLimit] = useState(10)
  
  // Columns to display
  const [showColumns, setShowColumns] = useState({
    distance: true,
    duration: true,
    pace: true,
    hr: true,
    power: true,
    cadence: false,
    elevation: false,
    calories: false,
  })
  
  // New plan form
  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    workout_type: 'Running',
    target_distance_km: '',
    target_pace: '',
    target_hr_zone: '',
    notes: '',
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchWorkouts() {
    setLoading(true)
    
    let query = supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)
    
    if (activityType) {
      query = query.ilike('activity_type', `%${activityType}%`)
    }
    if (minDistance) {
      query = query.gte('distance_km', parseFloat(minDistance))
    }
    if (maxDistance) {
      query = query.lte('distance_km', parseFloat(maxDistance))
    }
    
    const { data, error } = await query
    
    if (data) setWorkouts(data)
    setLoading(false)
  }

  async function fetchPlans() {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .order('scheduled_date', { ascending: true })
    
    if (data) setPlans(data)
  }

  async function createPlan() {
    if (!newPlan.title || !newPlan.scheduled_date) {
      alert('Please fill in title and date')
      return
    }
    
    const planData = {
      title: newPlan.title,
      description: newPlan.description || null,
      scheduled_date: newPlan.scheduled_date,
      workout_type: newPlan.workout_type,
      target_distance_km: ne
cat > src/lib/garmin-parser.ts << 'EOF'
import type { WorkoutInsert } from './database.types'

export function parseGarminCSV(csvText: string): WorkoutInsert[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const workouts: WorkoutInsert[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''))
    const row: Record<string, string> = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    const workout: WorkoutInsert = {
      activity_type: row['activity type'] || row['activity_type'] || row['type'] || 'Unknown',
      date: parseDate(row['date'] || row['start time'] || row['start_time'] || ''),
      duration_seconds: parseDuration(row['time'] || row['duration'] || row['elapsed time'] || ''),
      distance_km: parseDistance(row['distance'] || ''),
      avg_pace_per_km: row['avg pace'] || row['avg_pace'] || row['pace'] || null,
      avg_heart_rate: parseNumber(row['avg hr'] || row['avg_hr'] || row['avg heart rate'] || ''),
      max_heart_rate: parseNumber(row['max hr'] || row['max_hr'] || row['max heart rate'] || ''),
      avg_power: parseNumber(row['avg power'] || row['avg_power'] || row['power'] || ''),
      max_power: parseNumber(row['max power'] || row['max_power'] || ''),
      avg_cadence: parseNumber(row['avg cadence'] || row['avg_cadence'] || row['cadence'] || ''),
      elevation_gain: parseNumber(row['elev gain'] || row['elevation gain'] || row['total ascent'] || ''),
      calories: parseNumber(row['calories'] || ''),
    }
    
    if (workout.date) {
      workouts.push(workout)
    }
  }
  
  return workouts
}

function parseDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toISOString().split('T')[0]
  } catch {
    return dateStr
  }
}

function parseDuration(timeStr: string): number | null {
  if (!timeStr) return null
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return null
}

function parseDistance(distStr: string): number | null {
  if (!distStr) return null
  const num = parseFloat(distStr.replace(/[^\d.]/g, ''))
  return isNaN(num) ? null : num
}

function parseNumber(str: string): number | null {
  if (!str) return null
  const num = parseFloat(str.replace(/[^\d.]/g, ''))
  return isNaN(num) ? null : num
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}
