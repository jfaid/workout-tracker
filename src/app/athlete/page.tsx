'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { parseGarminCSV, formatDuration, formatDate } from '@/lib/garmin-parser'
import type { Workout, WorkoutPlan } from '@/lib/database.types'

export default function AthletePage() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'plans' | 'upload'>('workouts')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchWorkouts()
    fetchPlans()
  }, [])

  async function fetchWorkouts() {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(50)
    
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    
    const text = await selectedFile.text()
    const parsed = parseGarminCSV(text)
    setPreview(parsed)
  }

  async function handleUpload() {
    if (preview.length === 0) return
    
    setUploading(true)
    
    const { error } = await supabase
      .from('workouts')
      .insert(preview as any)
    
    if (error) {
      alert('Error uploading: ' + error.message)
    } else {
      alert(`Successfully uploaded ${preview.length} workouts!`)
      setFile(null)
      setPreview([])
      fetchWorkouts()
    }
    
    setUploading(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Athlete Dashboard</h1>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 rounded ${activeTab === 'workouts' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          My Workouts
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded ${activeTab === 'plans' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Training Plans
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Upload CSV
        </button>
      </div>

      {activeTab === 'workouts' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Workouts</h2>
          {loading ? (
            <p>Loading...</p>
          ) : workouts.length === 0 ? (
            <p className="text-gray-500">No workouts yet. Upload a Garmin CSV to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Type</th>
                    <th className="border p-2 text-left">Distance</th>
                    <th className="border p-2 text-left">Duration</th>
                    <th className="border p-2 text-left">Pace</th>
                    <th className="border p-2 text-left">Avg HR</th>
                    <th className="border p-2 text-left">Avg Power</th>
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((w) => (
                    <tr key={w.id}>
                      <td className="border p-2">{formatDate(w.date)}</td>
                      <td className="border p-2">{w.activity_type}</td>
                      <td className="border p-2">{w.distance_km?.toFixed(2)} km</td>
                      <td className="border p-2">{formatDuration(w.duration_seconds || 0)}</td>
                      <td className="border p-2">{w.avg_pace_per_km || '-'}</td>
                      <td className="border p-2">{w.avg_heart_rate || '-'}</td>
                      <td className="border p-2">{w.avg_power || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'plans' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Training Plans</h2>
          {plans.length === 0 ? (
            <p className="text-gray-500">No training plans assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{plan.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(plan.scheduled_date)}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {plan.workout_type}
                    </span>
                  </div>
                  {plan.description && <p className="mt-2">{plan.description}</p>}
                  <div className="mt-2 text-sm text-gray-600">
                    {plan.target_distance_km && <span>Distance: {plan.target_distance_km}km • </span>}
                    {plan.target_pace && <span>Pace: {plan.target_pace} • </span>}
                    {plan.target_hr_zone && <span>HR Zone: {plan.target_hr_zone}</span>}
                  </div>
                  {plan.notes && <p className="mt-2 text-sm italic">{plan.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Garmin CSV</h2>
          
          <div className="mb-4">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {preview.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Preview ({preview.length} workouts)</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse border text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Type</th>
                      <th className="border p-2">Distance</th>
                      <th className="border p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((w, i) => (
                      <tr key={i}>
                        <td className="border p-2">{w.date}</td>
                        <td className="border p-2">{w.activity_type}</td>
                        <td className="border p-2">{w.distance_km?.toFixed(2)} km</td>
                        <td className="border p-2">{formatDuration(w.duration_seconds || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && <p className="text-sm text-gray-500 mt-2">...and {preview.length - 10} more</p>}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
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
