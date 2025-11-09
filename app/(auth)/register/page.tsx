import { redirect } from 'next/navigation'

// Redirect to signup page
export default function RegisterPage() {
  redirect('/signup')
}