'use client'

import { useState } from 'react'
import { Microservice } from '@/types/database'
import { TrendingUp, Activity } from 'lucide-react'
import { clsx } from 'clsx'

interface StatsViewProps {
  microservices: Microservice[]
}

type TimeRange = '7D' | '14D' | '28D' | '90D'

export function StatsView({ microservices }: StatsViewProps) {
  const [velocityRange, setVelocityRange] = useState<TimeRange>('7D')
  const [activityRange, setActivityRange] = useState<TimeRange>('7D')

  // Calculate stats
  const totalServices = microservices.length
  const completedCount = microservices.filter(m => m.status === 'Done').length
  const inProgressCount = microservices.filter(m => m.status === 'In Progress').length
  const testingCount = microservices.filter(m => m.status === 'Testing').length
  const backlogCount = microservices.filter(m => m.status === 'Backlog').length

  const healthyCount = microservices.filter(m => m.health_status === 'Healthy').length
  const staleCount = microservices.filter(m => m.health_status === 'Stale').length
  const inactiveCount = microservices.filter(m => m.health_status === 'Inactive').length

  const avgProgress = totalServices > 0
    ? Math.round(microservices.reduce((sum, m) => sum + m.progress, 0) / totalServices)
    : 0

  const getDaysForRange = (range: TimeRange) => {
    switch (range) {
      case '7D': return 7
      case '14D': return 14
      case '28D': return 28
      case '90D': return 90
    }
  }

  const generateChartData = (range: TimeRange) => {
    const days = getDaysForRange(range)
    const labels = []
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))
      data.push(Math.floor(Math.random() * 5) + (completedCount > 0 ? 1 : 0))
    }

    return { labels: labels.slice(-7), data: data.slice(-7) }
  }

  const velocityData = generateChartData(velocityRange)

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard value={totalServices} label="Total Services" color="text-slate-800 dark:text-slate-200" />
        <StatCard value={completedCount} label="Completed" color="text-green-600 dark:text-green-400" />
        <StatCard value={inProgressCount} label="In Progress" color="text-blue-600 dark:text-blue-400" />
        <StatCard value={testingCount} label="Testing" color="text-amber-600 dark:text-amber-400" />
        <StatCard value={`${avgProgress}%`} label="Avg Progress" color="text-primary-600 dark:text-primary-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Completion Velocity</h3>
            </div>
            <TimeRangeSelector value={velocityRange} onChange={setVelocityRange} />
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{completedCount}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">completed</span>
            <span className="text-slate-400 dark:text-slate-500 ml-4 text-sm">{(completedCount / getDaysForRange(velocityRange)).toFixed(1)}/day avg</span>
          </div>

          {/* Simple Bar Chart */}
          <div className="h-40 flex items-end gap-2">
            {velocityData.data.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all hover:bg-blue-600 dark:hover:bg-blue-500"
                  style={{ height: `${Math.max((value / Math.max(...velocityData.data)) * 100, 5)}%` }}
                />
                <span className="text-xs text-slate-400 dark:text-slate-500">{velocityData.labels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-green-500" />
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Health Distribution</h3>
            </div>
            <TimeRangeSelector value={activityRange} onChange={setActivityRange} />
          </div>

          <div className="mb-4">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">{healthyCount}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2">healthy</span>
            <span className="text-slate-400 dark:text-slate-500 ml-4 text-sm">{totalServices > 0 ? Math.round((healthyCount / totalServices) * 100) : 0}% of total</span>
          </div>

          {/* Health Bar Chart */}
          <div className="h-40 flex items-end gap-4">
            <HealthBar label="Healthy" value={healthyCount} max={totalServices} color="bg-green-500" />
            <HealthBar label="Stale" value={staleCount} max={totalServices} color="bg-yellow-500" />
            <HealthBar label="Inactive" value={inactiveCount} max={totalServices} color="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 transition-colors">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Status Distribution</h3>
        <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
          {backlogCount > 0 && (
            <div
              className="bg-slate-400 dark:bg-slate-500 flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80"
              style={{ width: `${(backlogCount / totalServices) * 100}%` }}
              title={`Backlog: ${backlogCount}`}
            >
              {backlogCount > 0 && backlogCount}
            </div>
          )}
          {inProgressCount > 0 && (
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80"
              style={{ width: `${(inProgressCount / totalServices) * 100}%` }}
              title={`In Progress: ${inProgressCount}`}
            >
              {inProgressCount > 0 && inProgressCount}
            </div>
          )}
          {testingCount > 0 && (
            <div
              className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80"
              style={{ width: `${(testingCount / totalServices) * 100}%` }}
              title={`Testing: ${testingCount}`}
            >
              {testingCount > 0 && testingCount}
            </div>
          )}
          {completedCount > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium transition-all hover:opacity-80"
              style={{ width: `${(completedCount / totalServices) * 100}%` }}
              title={`Done: ${completedCount}`}
            >
              {completedCount > 0 && completedCount}
            </div>
          )}
        </div>
        <div className="flex gap-6 mt-4">
          <Legend color="bg-slate-400 dark:bg-slate-500" label="Backlog" count={backlogCount} />
          <Legend color="bg-blue-500" label="In Progress" count={inProgressCount} />
          <Legend color="bg-amber-500" label="Testing" count={testingCount} />
          <Legend color="bg-green-500" label="Done" count={completedCount} />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">All Services</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Health</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {microservices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{service.service_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{service.current_task}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={service.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${service.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{service.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <HealthBadge status={service.health_status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {service.last_update ? new Date(service.last_update).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors">
      <div className={clsx('text-3xl font-bold', color)}>{value}</div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  )
}

function TimeRangeSelector({ value, onChange }: { value: TimeRange; onChange: (v: TimeRange) => void }) {
  const options: TimeRange[] = ['7D', '14D', '28D', '90D']
  return (
    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            value === opt
              ? 'bg-primary-500 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function HealthBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-full h-full flex items-end">
        <div
          className={clsx('w-full rounded-t transition-all hover:opacity-80', color)}
          style={{ height: `${Math.max(percentage, 5)}%` }}
        />
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{value}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  )
}

function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('w-3 h-3 rounded-full', color)} />
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-400 dark:text-slate-500">({count})</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Backlog': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    'In Progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Testing': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    'Done': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  }
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', colors[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300')}>
      {status}
    </span>
  )
}

function HealthBadge({ status }: { status: string | null }) {
  const colors: Record<string, string> = {
    'Healthy': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Stale': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'Inactive': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    'Unknown': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  }
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', colors[status || 'Unknown'])}>
      {status || 'Unknown'}
    </span>
  )
}
