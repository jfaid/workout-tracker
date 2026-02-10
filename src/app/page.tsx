export default function Home() {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-bold mb-4">Workout Tracker</h1>
      <p className="text-gray-600 mb-8">Track training plans and Garmin workout data</p>
      
      <div className="flex gap-4 justify-center">
        <a 
          href="/athlete" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Athlete View
        </a>
        <a 
          href="/trainer" 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Trainer View
        </a>
      </div>
    </div>
  )
}
