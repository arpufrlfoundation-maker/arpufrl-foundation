'use client'

import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface DonationTrendChartProps {
  data: Array<{ date: string; amount: number; count: number }>
}

export function DonationTrendChart({ data }: DonationTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="amount"
          stroke="#8884d8"
          fill="#8884d8"
          name="Amount (₹)"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="count"
          stroke="#82ca9d"
          fill="#82ca9d"
          name="Count"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

interface TargetProgressChartProps {
  data: Array<{
    name: string
    target: number
    current: number
    percentage: number
  }>
}

export function TargetProgressChart({ data }: TargetProgressChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="current" fill="#82ca9d" name="Current" />
        <Bar dataKey="target" fill="#8884d8" name="Target" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface ReferralDistributionChartProps {
  data: Array<{ name: string; value: number }>
}

export function ReferralDistributionChart({ data }: ReferralDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface HierarchyPerformanceChartProps {
  data: Array<{
    role: string
    donations: number
    amount: number
    members: number
  }>
}

export function HierarchyPerformanceChart({ data }: HierarchyPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="role" type="category" width={150} />
        <Tooltip />
        <Legend />
        <Bar dataKey="donations" fill="#8884d8" name="Donations" />
        <Bar dataKey="amount" fill="#82ca9d" name="Amount (₹)" />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface MonthlyComparisonChartProps {
  data: Array<{
    month: string
    thisYear: number
    lastYear: number
  }>
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="thisYear"
          stroke="#8884d8"
          name="This Year"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="lastYear"
          stroke="#82ca9d"
          name="Last Year"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface ProgressGaugeProps {
  current: number
  target: number
  title: string
}

export function ProgressGauge({ current, target, title }: ProgressGaugeProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const data = [
    { name: 'Progress', value: percentage },
    { name: 'Remaining', value: 100 - percentage }
  ]

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell fill="#82ca9d" />
            <Cell fill="#e0e0e0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
        <div className="text-sm text-gray-600">
          ₹{current.toLocaleString()} / ₹{target.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

interface TopPerformersChartProps {
  data: Array<{
    name: string
    amount: number
    donations: number
  }>
}

export function TopPerformersChart({ data }: TopPerformersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 10)}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#8884d8" name="Amount (₹)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
