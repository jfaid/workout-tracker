export interface Database {
  public: {
    Tables: {
      workouts: {
        Row: {
          id: string
          activity_type: string
          date: string
          duration_seconds: number | null
          distance_km: number | null
          avg_pace_per_km: string | null
          avg_heart_rate: number | null
          max_heart_rate: number | null
          avg_power: number | null
          max_power: number | null
          avg_cadence: number | null
          elevation_gain: number | null
          calories: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>
      }
      workout_plans: {
        Row: {
          id: string
          title: string
          description: string | null
          scheduled_date: string
          workout_type: string | null
          target_distance_km: number | null
          target_pace: string | null
          target_hr_zone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_plans']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>
      }
    }
  }
}

export type Workout = Database['public']['Tables']['workouts']['Row']
export type WorkoutInsert = Database['public']['Tables']['workouts']['Insert']
export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row']
export type WorkoutPlanInsert = Database['public']['Tables']['workout_plans']['Insert']
