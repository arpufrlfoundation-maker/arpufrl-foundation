'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Program {
  _id: string
  name: string
  description?: string
}

export default function ManualDonationForm() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastDonationId, setLastDonationId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    amount: '',
    programId: '',
    paymentMethod: 'CASH',
    transactionId: '',
    notes: ''
  })

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true)
      const response = await fetch('/api/programs')
      const data = await response.json()

      let programsList: Program[] = []

      // Handle multiple response structures
      if (data.success?.data?.programs) {
        programsList = data.success.data.programs
      } else if (data.programs) {
        programsList = data.programs
      } else if (Array.isArray(data)) {
        programsList = data
      }

      setPrograms(programsList)

      // Auto-select first program
      if (programsList.length > 0) {
        setFormData(prev => ({ ...prev, programId: programsList[0]._id }))
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
      setError('Failed to load programs. Please refresh the page.')
    } finally {
      setLoadingPrograms(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/donations/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          donorEmail: formData.donorEmail || undefined,
          donorPhone: formData.donorPhone || undefined,
          transactionId: formData.transactionId || undefined,
          notes: formData.notes || undefined
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to record donation')
      }

      setSuccess(true)
      setLastDonationId(data.data.id)

      // Reset form
      setFormData({
        donorName: '',
        donorEmail: '',
        donorPhone: '',
        amount: '',
        programId: programs[0]?._id || '',
        paymentMethod: 'CASH',
        transactionId: '',
        notes: ''
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to record donation')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loadingPrograms) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" />
          Record Offline Donation
        </CardTitle>
        <CardDescription>
          Manually add donation data collected through cash, bank transfer, or other offline methods
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Donation recorded successfully! Transaction ID: {lastDonationId}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donorName">Donor Name *</Label>
              <Input
                id="donorName"
                value={formData.donorName}
                onChange={(e) => handleChange('donorName', e.target.value)}
                placeholder="Enter donor's full name"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="Enter amount"
                required
                min={100}
                max={100000}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorEmail">Donor Email</Label>
              <Input
                id="donorEmail"
                type="email"
                value={formData.donorEmail}
                onChange={(e) => handleChange('donorEmail', e.target.value)}
                placeholder="donor@example.com (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorPhone">Donor Phone</Label>
              <Input
                id="donorPhone"
                type="tel"
                value={formData.donorPhone}
                onChange={(e) => handleChange('donorPhone', e.target.value)}
                placeholder="10-digit number (optional)"
                minLength={10}
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programId">Program *</Label>
              <Select
                value={formData.programId}
                onValueChange={(value) => handleChange('programId', value)}
                required
              >
                <SelectTrigger id="programId">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program._id} value={program._id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleChange('paymentMethod', value)}
                required
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="transactionId">Transaction ID / Reference Number</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) => handleChange('transactionId', e.target.value)}
                placeholder="Optional reference number"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any additional information (optional)"
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !formData.programId}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Record Donation
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
