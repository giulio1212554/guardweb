# GuardWeb

Micro-SaaS di cybersecurity etica e preventiva per PMI italiane.

**Local-first**: funziona con `npm install && npm run dev` senza account Supabase, Stripe o chiavi esterne.

## Avvio in locale (5 passi)

1. **Clona / entra nella cartella**
   ```bash
   cd guardweb
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Copia le variabili d'ambiente**
   ```bash
   cp .env.example .env.local
   ```
   Di default `NEXT_PUBLIC_DEV_MODE=true`.

4. **Avvia il target vulnerabile** (terminale 1)
   ```bash
   npm run dev:target
   ```
   Espone `http://localhost:4000` con `/.env` e `/.git/config` finti.

5. **Avvia l'app** (terminale 2)
   ```bash
   npm run dev
   ```
   Apri `http://localhost:3000`.

### Seed dati di test (opzionale)
```bash
npm run seed
```

### Credenziali e codice demo di test
| Tipo | Valore |
|------|--------|
| Codice demo | `GW-TEST-0000` (10 scansioni) |
| Login rapido | `/dev-login` → Pro / Business / Admin |
| Target di test | `localhost:4000` |

## Deploy Vercel

Imposta env:
- `NEXT_PUBLIC_DEV_MODE=true`
- `DEMO_JWT_SECRET=dev-secret-change-me-in-production-32chars`
- `ADMIN_EMAIL=admin@guardweb.local`

## Stack

- Next.js 15 (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui style
- jose (JWT demo), zod
- Storage: file JSON locale **oppure** Supabase
- Vitest
