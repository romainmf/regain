/** Brin : une petite pousse dans un pot, le guide de l'île. */
export function BrinAvatar({ taille = 40 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#D6E9DD" />
      <path d="M20 22 C 20 16 20 13 20 10" stroke="#2F7A5C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M20 14 C 14 14 11 10 11 6 C 16 6 20 9 20 14 Z" fill="#5E9B62" />
      <path d="M20 12 C 25 12 29 9 30 5 C 25 5 21 7 20 12 Z" fill="#7FAE73" />
      <path d="M11 21 h 18 l -2.4 12 a 2 2 0 0 1 -2 1.6 h -9.2 a 2 2 0 0 1 -2 -1.6 Z" fill="#B0512A" />
      <rect x="10" y="20" width="20" height="4" rx="1.5" fill="#C96A41" />
      <circle cx="16.6" cy="28" r="1.3" fill="#22301F" />
      <circle cx="23.4" cy="28" r="1.3" fill="#22301F" />
      <path d="M18 30.6 q 2 1.6 4 0" stroke="#22301F" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <circle cx="14.6" cy="30" r="1.2" fill="#E89A8A" opacity=".7" />
      <circle cx="25.4" cy="30" r="1.2" fill="#E89A8A" opacity=".7" />
    </svg>
  )
}
