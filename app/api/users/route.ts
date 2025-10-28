// Users API routes placeholder
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Users API endpoint' })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'Create user endpoint' })
}