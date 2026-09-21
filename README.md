# A.M.U.N.Ì.

La copia di lavoro è questa cartella, DEFINITIVO. Tutte le modifiche e i deploy successivi partono da qui.

Sito pubblicato: https://amuni-definitivo.vercel.app
Repository: https://github.com/gaiabono02-maker/amuni_definitivo
Progetto Vercel: `amuni/amuni-definitivo`.

Il primo deploy in produzione è stato completato l’11 settembre 2026 tramite Vercel CLI. Le sette variabili Supabase sono configurate in Production e Preview; Site URL e redirect Supabase includono il dominio pubblico e localhost:8080.
La connessione automatica GitHub → Vercel è in attesa dell’installazione dell’app GitHub Vercel per questa repository. Dopo l’autorizzazione, eseguire `vercel git connect https://github.com/gaiabono02-maker/amuni_definitivo.git --yes` da questa cartella. Nel frattempo è possibile pubblicare con `vercel --prod`.

## Sviluppo locale

Usare Node.js 24 e npm. Eseguire `npm ci`, quindi `npm run dev`.
Il file `.env` locale è già configurato ed escluso da Git. Per un nuovo checkout, copiare `.env.example` in `.env` e completare la chiave server.

## Verifiche

- `npm run typecheck`
- `npm run build`: genera `.vercel/output`, incluse le funzioni server.
- `npm run preview`: anteprima della build.

Il package-lock.json è il lockfile di riferimento per npm e per Vercel.

## GitHub e Vercel

Pubblicare il contenuto di questa cartella in un repository GitHub e importarlo in Vercel.
Se il repository contiene direttamente questo progetto, la Root Directory è `.`.
Se contiene la cartella padre AMUNI, impostarla su `DEFINITIVO`.
Il framework e i comandi di installazione/build sono in `vercel.json`; usare Node.js 24.

Impostare in Vercel, per Production e Preview, le variabili elencate in `.env.example`, prendendo i valori dal `.env` locale.
`SUPABASE_SERVICE_ROLE_KEY` è esclusivamente server: non deve mai avere prefisso `VITE_` e non va inserita nel repository.
Il token di gestione Supabase non serve all’applicazione e non va caricato su Vercel.

Dopo il primo deploy, impostare in Supabase Authentication > URL Configuration il dominio `https://<progetto>.vercel.app` come Site URL e consentire i redirect di autenticazione del sito. Ripetere la configurazione quando viene collegato il dominio proprietario.

## Supabase

Progetto: `jhbjimtznbeehcctsdgd`.
Le sette migrazioni originali in `supabase/migrations` sono state applicate al nuovo database l’11 settembre 2026, creando anche il bucket pubblico `catalogo`.
Le migrazioni sono state applicate tramite Management API in una transazione; la cronologia della CLI Supabase non è stata inizializzata. Non rieseguire le migrazioni sullo stesso database senza prima allineare la cronologia.

Il vecchio database è distinto da questo progetto: record, account e file caricati nel vecchio storage non sono contenuti nella copia dei sorgenti e non sono stati trasferiti. Il nuovo database parte vuoto. L’account della proprietaria è abilitato con il ruolo `admin`. Le credenziali iniziali sono conservate separatamente dal repository.

L’endpoint `/api/notify-stato` rimane quello originale: risponde correttamente ma l’invio email reale non è implementato.

Configurazione di hosting: https://vercel.com/docs/frameworks/full-stack/tanstack-start

## Conferma candidatura via email

Il modulo «Invia la candidatura» salva l'iscrizione dal server e poi invia una
conferma personalizzata con una breve presentazione di A.M.U.N.Ì.
Configurare in locale e su Vercel le variabili server `AMUNI_SMTP_HOST`,
`AMUNI_SMTP_PORT` (465 per TLS diretto, 587 per STARTTLS), `AMUNI_SMTP_USER`,
`AMUNI_SMTP_PASSWORD` e `AMUNI_NOREPLY_EMAIL`. Il mittente no-reply deve essere
autorizzato dal provider SMTP. Non usare il prefisso `VITE_` per queste variabili.
Se l'email non parte, la candidatura resta salvata e il modulo avvisa l'utente.
La consegna reale richiede credenziali SMTP configurate e una prova su una
casella di test dopo il deploy.

## Area amministratore

Accesso: https://amuni-definitivo.vercel.app/admin/login. Solo gli account con ruolo `admin` possono leggere gli elenchi completi; i permessi sono verificati anche dalle policy Supabase.

- **Clienti registrati**: tutti i profili, compresi quelli senza ordini o piano, con ricerca, filtro provincia, scheda contatto e CSV dei risultati filtrati.
- **Iscrizioni aziende**: candidature ricevute dal modulo pubblico, ricerca, filtro stato, esportazione CSV e aggiornamento della valutazione.
- **Aggiorna dati** ricarica le nuove iscrizioni; l’orario dell’ultimo aggiornamento è visibile nel pannello.
- **Il mio account** permette di cambiare la password.

I profili vengono creati dal trigger `on_auth_user_created`; le candidature aziendali sono salvate in `iscrizioni`. Gli elenchi vengono letti a blocchi ordinati e mostrati su pagine da 20, senza fermarsi al limite predefinito dell’API.

Verifica della lettura paginata: `node --test scripts/admin-pagination.test.mjs`.
