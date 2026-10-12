/**
 * Porte d'accès bêta : vérifie un mot de passe contre la variable
 * d'environnement BETA_PASSWORD (jamais exposée au navigateur).
 * Si aucune variable n'est définie, l'accès est libre.
 */
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

/** Comparaison à temps constant pour ne pas fuiter la longueur/le contenu. */
function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function handler(req: Request): Promise<Response> {
  const attendu = process.env.BETA_PASSWORD || ''
  if (!attendu) return json({ ok: true, libre: true })
  if (req.method !== 'POST') return json({ ok: false }, 405)
  try {
    const { password } = (await req.json()) as { password?: string }
    return json({ ok: typeof password === 'string' && egal(password, attendu) })
  } catch {
    return json({ ok: false }, 400)
  }
}
