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

- Une île 2.5D en SVG (construction, pose et déplacement des bâtiments, état vivant).
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

## Confidentialité

Tout vit sur l'appareil : pas de compte, pas de cloud. L'île s'exporte et
se réimporte en JSON (à venir). En bêta, les factures restent des brouillons,
jamais envoyées.

## Statut

Bêta en construction. Jalons faits : squelette et île, catalogue et recrutement,
économie et file de validation, gestion des agents, création d'agent, accueil et
visite guidée. À venir : export/import, boutique de décor et ambiances, moteur LLM,
tests Playwright, déploiement.
