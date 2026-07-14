export default function StatCard({ title, value, icon: IconComponent }) {
  return (
    <div className="dashboard-panel hover:border-primary/40 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-primary text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-primary">
          {IconComponent && <IconComponent className="h-6 w-6" />}
        </div>
      </div>
    </div>
  )
}