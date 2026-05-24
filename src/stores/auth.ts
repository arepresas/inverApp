import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  let initialized = false

  async function init() {
    if (initialized) return
    initialized = true

    loading.value = true
    error.value = null

    try {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      user.value = data.session?.user ?? null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to restore session'
    } finally {
      loading.value = false
    }

    // Listen for auth state changes (registered once)
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  async function signInWithGoogle() {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })

    if (err) {
      error.value = err.message
    }

    loading.value = false
  }

  async function signOut() {
    loading.value = true
    error.value = null

    const { error: err } = await supabase.auth.signOut()

    if (err) {
      error.value = err.message
    }

    loading.value = false
  }

  return {
    user,
    session,
    loading,
    error,
    init,
    signInWithGoogle,
    signOut,
  }
})
