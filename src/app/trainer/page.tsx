'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatDate } from '@/lib/garmin-parser'
import type { Workout, WorkoutPlan, WorkoutPlanInsert } from '@/lib/database.types'

const ACTIVITY_TYPES = ['All', 'Running', 'Cycling', 'Swimming', 'Walking', 'Strength Training']
const COLUMNS = [
  { key: 'date', label: 'Date', always: true },
  { key: 'activity_type', label: 'Type', always: true },
  { key: 'distance_km', label: 'Distance' },
  { key: 'duration_seconds', label: 'Duration' },
  { key: 'avg_pace_per_km', label: 'Pace' },
  { key: 'avg_heart_rate', label: 'Avg HR' },
  { key: 'max_heart_rate', label: 'Max HR' },
  { key: 'avg_power', label: 'Avg Power' },
  { key: 'max_power', label: 'Max Power' },
  { key: 'avg_cadence', label: 'Cadence' },
  { key: 'elevation_gain', label: 'Elevation' },
  { key: 'calories', label: 'Calories' },
]

export default function TrainerPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'workouts' | 'plans'>('workouts')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filters
  const [activityType, setActivityType] = useState('All')
  const [minDistance, setMinDistance] = useState('')
  const [maxDistance, setMaxDistance] = useState('')
  const [limit, setLimit] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'date', 'activity_type', 'distance_km', 'avg_pace_per_km', 'avg_heart_rate', 'avg_power'
  ])

  // New plan form
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [newPlan, setNewPlan] = useState<Partial<WorkoutPlanInsert>>({
    title: '',
    description: '',
    scheduled_date: '',
    workout_type: '',
    target_distance_km: undefined,
    target_pace: '',
    notes: '',
  })

  useEffect(() => {
    loadWorkouts()
    loadPlans()
  }, [])

  async function loadWorkouts() {
    setLoading(true)

    let query = supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (activityType !== 'All') {
      query = query.ilike('activity_type', `%${activityType}%`)
    }

    if (minDistance) {
      query = query.gte('distance_km', parseFloat(minDistance))
    }

    if (maxDistance) {
      query = query.lte('distance_km', parseFloat(maxDistance))
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading workouts:', error)
      setLoading(false)
      return
    }

    setWorkouts(data || [])
    setLoading(false)
  }

  async function loadPlans() {
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .order('scheduled_date', { ascending: true })

    if (error) {
      console.error('Error loading plans:', error)
      return
    }
    setPlans(data || [])
  }

  function handleColumnToggle(column: string) {
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  function applyFilters() {
    loadWorkouts()
  }

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newPlan.title || !newPlan.scheduled_date) {
      setMessage({ type: 'error', text: 'Title and date are required' })
      return
    }

    const { error } = await supabase
      .from('workout_plans')
      .insert({
        title: newPlan.title,
        description: newPlan.description || null,
        scheduled_date: newPlan.scheduled_date,
        workout_type: newPlan.workout_type || null,
        target_distance_km: newPlan.target_distance_km || null,
        target_pace: newPlan.target_pace || null,
        target_hr_zone: null,
        notes: newPlan.notes || null,
      })

    if (error) {
      setMessage({ type: 'error', text: `Failed to create plan: ${error.message}` })
      return
    }

    setMessage({ type: 'success', text: 'Plan created successfully!' })
    setNewPlan({ title: '', description: '', scheduled_date: '', workout_type: '', target_distance_km: undefined, target_pace: '', notes: '' })
    setShowPlanForm(false)
    loadPlans()
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('Delete this plan?')) return

    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage({ type: 'error', text: `Failed to delete: ${error.message}` })
      return
    }

    loadPlans()
  }

  function renderCellValue(workout: Workout, key: string) {
    switch (key) {
      case 'date':
        return formatDate(workout.date)
      case 'distance_km':
        return workout.distance_km ? `${workout.distance_km.toFixed(2)} km` : '-'
      case 'duration_seconds':
        return formatDuration(workout.duration_seconds)
      case 'avg_heart_rate':
      case 'max_heart_rate':
        return workout[key] ? `${workout[key]} bpm` : '-'
      case 'avg_power':
      case 'max_power':
        return workout[key] ? `${workout[key]} W` : '-'
      case 'avg_cadence':
        return workout[key] ? `${workout[key]} spm` : '-'
      case 'elevation_gain':
        return workout[key] ? `${workout[key]} m` : '-'
      case 'calories':
        return workout[key] ?? '-'
      default:
        return (workout as Record<string, unknown>)[key]?.toString() ?? '-'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trainer Dashboard</h1>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 -mb-px ${activeTab === 'workouts' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
        >
          Athlete Workouts
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 -mb-px ${activeTab === 'plans' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-600'}`}
        >
          Training Plans
        </button>
      </div>

      {/* Workouts Tab */}
      {activeTab === 'workouts' && (
        <div>
          {/* Filters */}
          <div className="bg-white border rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Filters</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                >
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Min Distance (km)</label>
                <input
                  type="number"
                  value={minDistance}
                  onChange={(e) => setMinDistance(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g., 9.5"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Distance (km)</label>
                <input
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                  placeholder="e.g., 10.5"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Show last</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value={5}>5 workouts</option>
                  <option value={10}>10 workouts</option>
                  <option value={20}>20 workouts</option>
                  <option value={50}>50 workouts</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={applyFilters}
                  className="w-full px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Column Selector */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Visible Columns</label>
              <div className="flex flex-wrap gap-2">
                {COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={visibleColumns.includes(col.key)}
                      onChange={() => !col.always && handleColumnToggle(col.key)}
                      disabled={col.always}
                      className="rounded"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : workouts.length === 0 ? (
            <p className="text-gray-500">No workouts match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                      <th key={col.key} className="px-3 py-2 text-left">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workouts.map((w) => (
                    <tr key={w.id} className="border-b hover:bg-gray-50">
                      {COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                        <td key={col.key} className="px-3 py-2">
                          {renderCellValue(w, col.key)}
                        </td>
                      ))}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Training Plans</h2>
            <button
              onClick={() => setShowPlanForm(!showPlanForm)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              {showPlanForm ? 'Cancel' : '+ New Plan'}
            </button>
          </div>

          {/* New Plan Form */}
          {showPlanForm && (
            <form onSubmit={handleCreatePlan} className="bg-white border rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Create New Plan</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Title *</label>
                  <input
                    type="text"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                    placeholder="e.g., Week 12 - Speed Work"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    value={newPlan.scheduled_date}
                    onChange={(e) => setNewPlan({ ...newPlan, scheduled_date: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Workout Type</label>
                  <input
                    type="text"
                    value={newPlan.workout_type}
                    onChange={(e) => setNewPlan({ ...newPlan, workout_type: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                    placeholder="e.g., Intervals, Recovery, Long Run"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Distance (km)</label>
                  <input
                    type="number"
                    value={newPlan.target_distance_km ?? ''}
                    onChange={(e) => setNewPlan({ ...newPlan, target_distance_km: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full border rounded px-2 py-1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Target Pace</label>
                  <input
                    type="text"
                    value={newPlan.target_pace}
                    onChange={(e) => setNewPlan({ ...newPlan, target_pace: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                    placeholder="e.g., 5:30/km"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  rows={2}
                  placeholder="Workout details and instructions..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-1">Notes</label>
                <textarea
                  value={newPlan.notes}
                  onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  rows={2}
                  placeholder="Additional notes..."
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Plan
              </button>
            </form>
          )}

          {/* Plans List */}
          {plans.length === 0 ? (
            <p className="text-gray-500">No plans created yet.</p>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{plan.title}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-500">{formatDate(plan.scheduled_date)}</span>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {plan.description && <p className="text-gray-700 mb-2">{plan.description}</p>}
                  <div className="flex gap-4 text-sm text-gray-600">
                    {plan.workout_type && <span>Type: {plan.workout_type}</span>}
                    {plan.target_distance_km && <span>Distance: {plan.target_distance_km} km</span>}
                    {plan.target_pace && <span>Target Pace: {plan.target_pace}</span>}
                  </div>
                  {plan.notes && <p className="mt-2 text-sm text-gray-500 italic">{plan.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
