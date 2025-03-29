'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function Home() {
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, initialized, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Reindirizzamento in corso...</p>
    </div>
  )
}