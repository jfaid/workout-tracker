import Papa from 'papaparse'
import type { WorkoutInsert } from './database.types'

// Common Garmin Connect CSV column names
// These may vary slightly based on export settings
interface GarminRow {
  'Activity Type'?: string
  'Date'?: string
  'Title'?: string
  'Distance'?: string
  'Calories'?: string
  'Time'?: string
  'Avg HR'?: string
  'Max HR'?: string
  'Avg Run Cadence'?: string
  'Avg Pace'?: string
  'Elev Gain'?: string
  'Elev Loss'?: string
  'Avg Power'?: string
  'Max Power'?: string
  // Alternative column names
  'Activity_Type'?: string
  'Avg_HR'?: string
  'Max_HR'?: string
  'Avg_Pace'?: string
  'Avg_Power'?: string
  'Max_Power'?: string
  'Avg_Run_Cadence'?: string
  'Elev_Gain'?: string
}

function parseDistance(value: string | undefined): number | null {
  if (!value) return null
  // Remove units like "km", "mi", commas
  const num = parseFloat(value.replace(/[^\d.-]/g, ''))
  return isNaN(num) ? null : num
}

function parseNumber(value: string | undefined): number | null {
  if (!value) return null
  const num = parseFloat(value.replace(/[^\d.-]/g, ''))
  return isNaN(num) ? null : Math.round(num)
}

function parseDuration(value: string | undefined): number | null {
  if (!value) return null
  
  // Handle HH:MM:SS or MM:SS format
  const parts = value.split(':').map(p => parseInt(p, 10))
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  }
  
  return null
}

function parseDate(value: string | undefined): string | null {
  if (!value) return null
  
  // Try to parse various date formats
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  
  return date.toISOString()
}

function parsePace(value: string | undefined): string | null {
  if (!value) return null
  // Return as-is if it looks like a pace (e.g., "5:30")
  if (value.includes(':')) return value.trim()
  return value.trim() || null
}

export function parseGarminCSV(file: File): Promise<WorkoutInsert[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<GarminRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const workouts: WorkoutInsert[] = results.data
          .map((row): WorkoutInsert | null => {
            // Get values with fallback for alternative column names
            const activityType = row['Activity Type'] || row['Activity_Type']
            const date = row['Date']
            
            // Skip rows without essential data
            if (!activityType && !date) return null
            
            return {
              activity_type: activityType || 'Unknown',
              date: parseDate(date) || new Date().toISOString(),
              duration_seconds: parseDuration(row['Time']),
              distance_km: parseDistance(row['Distance']),
              avg_pace_per_km: parsePace(row['Avg Pace'] || row['Avg_Pace']),
              avg_heart_rate: parseNumber(row['Avg HR'] || row['Avg_HR']),
              max_heart_rate: parseNumber(row['Max HR'] || row['Max_HR']),
              avg_power: parseNumber(row['Avg Power'] || row['Avg_Power']),
              max_power: parseNumber(row['Max Power'] || row['Max_Power']),
              avg_cadence: parseNumber(row['Avg Run Cadence'] || row['Avg_Run_Cadence']),
              elevation_gain: parseNumber(row['Elev Gain'] || row['Elev_Gain']),
              calories: parseNumber(row['Calories']),
              notes: null,
            }
          })
          .filter((w): w is WorkoutInsert => w !== null)
        
        resolve(workouts)
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

// Format seconds as HH:MM:SS or MM:SS
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '-'
  
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
