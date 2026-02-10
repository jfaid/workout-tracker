'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { parseGarminCSV, formatDuration, formatDate } from '@/lib/garmin-parser'
import type { Workout, WorkoutInsert, WorkoutPlan } from '@/lib/database.types'

export default function AthletePage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<WorkoutInsert[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'workouts' | 'plans' | 'upload'>('workouts')

  useEffect(() => {
    loadWorkouts()
    loadPlans()
  }, [])

  async function loadWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error loading workouts:', error)
      return
    }
    setWorkouts(data || [])
  }

  async function loadPlans() {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error loading plans:', error)
      return
    }
    setPlans(data || [])
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const parsed = await parseGarminCSV(file)
      setPreview(parsed)
      setMessage({ type: 'success', text: `Parsed ${parsed.length} workouts from CSV` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse CSV file' })
      console.error(error)
    }
  }

  async function handleUpload() {
    if (preview.length === 0) return

    setUploading(true)
    setMessage(null)

    const { error } = await supabase
      .from('workouts')
      .insert(preview)

    setUploading(false)

    if (error) {
      setMessage({ type: 'error', text: `Upload failed: ${error.message}` })
      console.error(error)
      return
    }

    setMessage({ type: 'success', text: `Successfully uploaded ${preview.length} workouts!` })
    setPreview([])
    loadWorkouts()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Athlete Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 -mb-px ${activeTab === 'workouts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          My Workouts
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 -mb-px ${activeTab === 'plans' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Training Plans
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 -mb-px ${activeTab === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
        >
          Upload CSV
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Workouts Tab */}
      {activeTab === 'workouts' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Workouts</h2>
          {workouts.length === 0 ? (
            <p className="text-gray-500">No workouts yet. Upload a Garmin CSV to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Distance</th>
                    <th className="px-3 py-2 text-right">Duration</th>
                    <th className="px-3 py-2 text-right">Pace</th>
                    <th className="px-3 py-2 text-right">Avg HR</th>
                    <th className="px-3 py-2 text-right">Avg Power</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((w) => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{formatDate(w.date)}</td>
                      <td className="px-3 py-2">{w.activity_type}</td>
                      <td className="px-3 py-2 text-right">{w.distance_km?.toFixed(2) ?? '-'} km</td>
                      <td className="px-3 py-2 text-right">{formatDuration(w.duration_seconds)}</td>
                      <td className="px-3 py-2 text-right">{w.avg_pace_per_km ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{w.avg_heart_rate ?? '-'} bpm</td>
                      <td className="px-3 py-2 text-right">{w.avg_power ?? '-'} W</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upcoming Training Plans</h2>
          {plans.length === 0 ? (
            <p className="text-gray-500">No upcoming plans assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{plan.title}</h3>
                    <span className="text-sm text-gray-500">{formatDate(plan.scheduled_date)}</span>
                  </div>
                  {plan.description && <p className="text-gray-700 mb-2">{plan.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-600">
                    {plan.workout_type && <span>Type: {plan.workout_type}</span>}
                    {plan.target_distance_km && <span>Distance: {plan.target_distance_km} km</span>}
                    {plan.target_pace && <span>Target Pace: {plan.target_pace}</span>}
                    {plan.target_hr_zone && <span>HR Zone: {plan.target_hr_zone}</span>}
                  </div>
                  {plan.notes && <p className="mt-2 text-sm text-gray-500 italic">{plan.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upload Garmin CSV</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium">Select CSV file from Garmin Connect export</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Preview ({preview.length} workouts)</h3>
              <div className="overflow-x-auto mb-4 max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Distance</th>
                      <th className="px-3 py-2 text-right">Duration</th>
                      <th className="px-3 py-2 text-right">Pace</th>
                      <th className="px-3 py-2 text-right">Avg HR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 20).map((w, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-3 py-2">{formatDate(w.date)}</td>
                        <td className="px-3 py-2">{w.activity_type}</td>
                        <td className="px-3 py-2 text-right">{w.distance_km?.toFixed(2) ?? '-'} km</td>
                        <td className="px-3 py-2 text-right">{formatDuration(w.duration_seconds)}</td>
                        <td className="px-3 py-2 text-right">{w.avg_pace_per_km ?? '-'}</td>
                        <td className="px-3 py-2 text-right">{w.avg_heart_rate ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 20 && (
                  <p className="text-sm text-gray-500 mt-2">... and {preview.length - 20} more</p>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : `Upload ${preview.length} Workouts`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
