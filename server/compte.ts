import { createClient } from '@supabase/supabase-js'

/**
 * Côté serveur : qui appelle ? On vérifie le jeton de session Supabase
 * envoyé par le client (en-tête Authorization: Bearer …). Partagé par la
 * fonction Netlify et la fonction Vercel.
 *
 * Variables : SUPABASE_URL et SUPABASE_ANON_KEY (à défaut, les VITE_… du
 * build, que Netlify expose aussi aux fonctions). Sans configuration, on
 * refuse tout appel, sauf si ACCES_LIBRE=1 (démo publique).
 */
export interface Appelant {
  id: string
  email?: string
}

export type Verification = { ok: true; appelant: Appelant | null } | { ok: false; statut: 401 | 503; message: string }

const url = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const cle = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

/** Extrait le jeton d'un en-tête Authorization. */
export function jetonDe(authorization: string | null | undefined): string | null {
  const m = /^Bearer\s+(.+)$/i.exec(authorization ?? '')
  return m ? m[1].trim() : null
}

export async function verifierAppelant(authorization: string | null | undefined): Promise<Verification> {
  if (process.env.ACCES_LIBRE === '1') return { ok: true, appelant: null }
  if (!url() || !cle()) return { ok: false, statut: 503, message: 'Comptes non configurés côté serveur.' }
  const jeton = jetonDe(authorization)
  if (!jeton) return { ok: false, statut: 401, message: 'Connexion requise.' }
  const supabase = createClient(url(), cle(), { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.getUser(jeton)
  if (error || !data.user) return { ok: false, statut: 401, message: 'Session invalide ou expirée.' }
  return { ok: true, appelant: { id: data.user.id, email: data.user.email } }
}
