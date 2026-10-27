# Regain

Un atelier d'agents IA pour indépendants et digital nomads. On recrute des agents
qui préparent les petites choses de son activité ; on valide, et une île 2.5D
solarpunk pousse au fil des validations.

> **Ils préparent, tu valides.** Rien ne part jamais sans ton accord — et en bêta,
> rien n'est envoyé du tout.

## Les trois domaines

- **Ma boîte** (argile) : administratif, conformité, trésorerie.
- **Ma peau** (prune) : rythme, énergie, équilibre, lien social.
- **Ma planète** (vert) : empreinte, sobriété, impact.

Prendre soin des trois en même temps fait grandir l'activité : chaque domaine
produit une ressource qu'un autre consomme.

## Ce que fait la bêta

- Mon île, façon jeu : une île en SVG isométrique avec trois maisons (Atelier, Spa, Ma maison) et un jardin en plein air que l'on dispose où l'on veut. Un personnage y marche (chemins calculés sur la grille), entre dans les lieux ; dedans, les agents travaillent à leur poste et parlent : on valide ce qu'ils ont préparé sans quitter la scène. Les maisons donnent signe de vie quand un agent attend (fumée, vapeur, fenêtres éclairées, drapeau, robot au portillon), Brin salue au passage et pointe le lieu qui attend. Ambiances, météo, murs et sols de la boutique s'appliquent à l'île et aux intérieurs. Sur téléphone, le tableau de bord est un tiroir sous l'île ; sur ordinateur, trois colonnes.
- Un catalogue d'agents par domaine, avec filtre par objectif, et le recrutement.
- La création simplifiée d'un agent, en quatre étapes.
- La file « À valider » et l'économie de jeu (graines, élan, récolte, repos).
- Les connexions entre domaines (chaînes), avec flux doré et bandeau.
- Un accueil et une visite guidée, menés par Brin, l'arbre au cœur de l'île.

## Pile technique

- Application web mobile-first installable (PWA).
- React + TypeScript + Vite.
- Rendu de l'île en SVG isométrique maison, sans moteur 3D.
- Stockage local-first dans IndexedDB (Dexie) ; pas de compte, fonctionne hors ligne.
- Moteur d'agents derrière une interface : `RuleEngine` déterministe par défaut,
  `LlmEngine` optionnel (à venir) appelant une fonction serverless `/api/agent`.

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production
npm run test       # tests unitaires (Vitest)
npm run e2e         # test de fumée Playwright (à venir)
```

## Bêta privée : les comptes

En ligne, on entre avec son adresse e-mail : Supabase envoie un lien magique
(ou un code à six chiffres si le modèle d'e-mail inclut `{{ .Token }}`).
Seules les adresses invitées peuvent se connecter ; rien ne se crée tout seul.
Le compte sert à savoir qui teste et à réserver le mode IA (la fonction
`/api/agent` vérifie le jeton de session) ; l'île, elle, reste sur l'appareil.

Mise en place, une fois :

1. Créer un projet Supabase ; dans Authentication → Sign In / Providers,
   laisser Email et **désactiver « Allow new users to sign up »**.
2. Dans Authentication → URL Configuration : Site URL = l'adresse du site,
   et l'ajouter aux Redirect URLs.
3. Copier l'URL du projet et la clé « publishable » (Settings → API Keys ;
   jamais la clé secrète) dans les variables d'environnement du site :
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (voir
   `.env.example`), puis redéployer.
4. Inviter chaque testeur depuis Authentication → Users → **Invite user** :
   la personne reçoit un e-mail et entre directement. Pour retirer quelqu'un,
   supprimer l'utilisateur.

Sans configuration Supabase, la version en ligne reste fermée (écran « bêta
privée »). En développement local sans configuration, l'accès est libre.

## Confidentialité

Tout vit sur l'appareil : le compte ne porte qu'une adresse e-mail, pas de
cloud pour l'île. L'île s'exporte et se réimporte en JSON. En bêta, les
factures restent des brouillons, jamais envoyées.

## Statut

Bêta en construction. Jalons faits : squelette et île, catalogue et recrutement,
économie et file de validation, gestion des agents, création d'agent, accueil et
visite guidée. À venir : export/import, boutique de décor et ambiances, moteur LLM,
tests Playwright, déploiement.
