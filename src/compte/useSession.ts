import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface EtatSession {
  /** Vrai tant qu'on ne sait pas encore si quelqu'un est connecté. */
  chargement: boolean
  session: Session | null
  email: string | undefined
  deconnecter: () => Promise<void>
}

/** La session Supabase courante, suivie en direct (lien magique, déconnexion, expiration). */
export function useSession(): EtatSession {
  const [session, setSession] = useState<Session | null>(null)
  const [chargement, setChargement] = useState(supabase !== null)

  useEffect(() => {
    if (!supabase) return
    let actif = true
    supabase.auth.getSession().then(({ data }) => {
      if (!actif) return
      setSession(data.session)
      setChargement(false)
    })
    const { data: abonnement } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      setChargement(false)
    })
    return () => {
      actif = false
      abonnement.subscription.unsubscribe()
    }
  }, [])

  return {
    chargement,
    session,
    email: session?.user.email,
    deconnecter: async () => {
      await supabase?.auth.signOut()
    },
  }
}
