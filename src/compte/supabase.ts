import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Les comptes : Supabase gère l'identité (lien magique par e-mail), rien
 * d'autre pour l'instant. L'île reste sur l'appareil.
 *
 * - En production, un compte est toujours requis : sans configuration
 *   Supabase, l'app n'ouvre pas (bêta privée, rien n'est visible).
 * - En développement, sans configuration, l'accès est libre ; avec, on
 *   passe par l'écran de connexion comme en ligne.
 * - VITE_ACCES_LIBRE=1 au build désactive les comptes (démo publique).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
/** Clé « publishable » (ex-clé anon) : faite pour le navigateur. */
const cleAnonyme = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const supabase: SupabaseClient | null =
  url && cleAnonyme ? createClient(url, cleAnonyme, { auth: { flowType: 'implicit' } }) : null

export const accesLibre = import.meta.env.VITE_ACCES_LIBRE === '1'

/** Faut-il un compte pour entrer ? */
export const compteRequis = !accesLibre && (import.meta.env.PROD || supabase !== null)

/** Le jeton de session à joindre aux appels serveur (undefined si pas connecté). */
export async function jetonAcces(): Promise<string | undefined> {
  if (!supabase) return undefined
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

/** Où Supabase renvoie après le clic sur le lien : la racine de l'app. */
export const urlRetour = () => new URL(import.meta.env.BASE_URL, window.location.origin).toString()
