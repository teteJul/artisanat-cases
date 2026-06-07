# Guide de démarrage — Artisanat Cases

## Prérequis

- Node.js 18+
- Base de données PostgreSQL (Supabase recommandé : supabase.com — gratuit)
- Compte Stripe
- Compte Resend (resend.com — gratuit jusqu'à 3000 emails/mois)
- Compte UploadThing (uploadthing.com — gratuit)

---

## 1. Base de données (Supabase)

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Récupérez l'URL de connexion : Settings → Database → Connection String (mode "Transaction")
4. Copiez dans `.env` : `DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"`

---

## 2. Variables d'environnement

Copiez `.env.example` en `.env` et remplissez :

```bash
cp .env.example .env
```

### Générer NEXTAUTH_SECRET :
```bash
openssl rand -base64 32
```

### Stripe :
1. Créez un compte sur stripe.com
2. Récupérez les clés dans Dashboard → Developers → API keys
3. Pour le webhook : Stripe CLI → `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   Copiez le `STRIPE_WEBHOOK_SECRET` affiché

### Resend :
1. Créez un compte sur resend.com
2. Ajoutez votre domaine artisanatcases.fr
3. Récupérez la clé API

### UploadThing :
1. Créez un compte sur uploadthing.com
2. Récupérez le token dans Dashboard → API Keys

---

## 3. Initialiser la base de données

```bash
npm run db:push      # Appliquer le schéma
npm run db:seed      # Insérer les données de départ
```

Comptes créés par le seed :
- **Admin** : admin@artisanatcases.fr / admin123
- **Client test** : client@test.fr / client123

---

## 4. Lancer en développement

```bash
npm run dev
```

Ouvrir : http://localhost:3000

Pour tester les paiements Stripe :
```bash
npm run stripe:listen
```

---

## 5. Déploiement sur Hostinger

Votre plan Hostinger Business inclut 5 apps Node.js. Pour déployer :

1. Dans Hostinger hPanel → Sites Web → Gérer → Node.js
2. Créez une nouvelle app Node.js
3. Pointez vers votre dossier de build
4. Configurez les variables d'environnement
5. Build command : `npm run build`
6. Start command : `npm run start`

### Alternativement — Vercel (plus simple) :
1. Poussez le code sur GitHub
2. Connectez Vercel à votre repo
3. Configurez les variables d'environnement dans Vercel
4. Pointez votre domaine artisanatcases.fr vers Vercel

---

## 6. Cron job — Rappels emails J-1

Sur Hostinger, configurez un cron job quotidien à 8h00 :
```
0 8 * * * curl -s "https://artisanatcases.fr/api/cron/reminders?secret=VOTRE_CRON_SECRET" > /dev/null
```

Ajoutez dans `.env` :
```
CRON_SECRET="un-secret-long-et-aleatoire"
```

---

## 7. Vacances scolaires

Synchronisation automatique depuis l'API officielle de l'Éducation nationale (Zone C).
L'admin peut aussi ajouter manuellement des périodes de fermeture depuis le BO.

---

## Architecture du projet

```
src/
  app/
    page.tsx              ← Page d'accueil
    (public)/             ← Pages vitrine (services, galerie, catalogue...)
    (auth)/               ← Connexion, inscription
    (client)/mon-espace/  ← Espace client
    (admin)/admin/        ← Back-office admin
    api/                  ← Routes API
  components/
    layout/               ← Navbar, Footer
    booking/              ← Composants réservation
    admin/                ← Composants admin
  lib/
    prisma.ts             ← Client Prisma
    auth.ts               ← NextAuth config
    stripe.ts             ← Client Stripe
    resend.ts             ← Client emails
  emails/                 ← Templates React Email
prisma/
  schema.prisma           ← Schéma BDD
  seed.ts                 ← Données initiales
```

---

## IMPORTANT — Fichier à supprimer

Le fichier `src/app/(public)/page.tsx` doit être supprimé manuellement.
Il crée un conflit de route avec `src/app/page.tsx`.
```
Supprimer : src/app/(public)/page.tsx
```

---

## Comptes et accès

| Service | URL | Usage |
|---|---|---|
| Supabase | supabase.com | Base de données |
| Stripe | dashboard.stripe.com | Paiements |
| Resend | resend.com | Emails |
| UploadThing | uploadthing.com | Images |
| Hostinger | hpanel.hostinger.com | Hébergement |
