// Edge Function: admin-create-user
//
// Legt einen neuen Supabase-Auth-Nutzer + zugehörige Profil-Zeile an.
// Darf NUR vom Admin (ADMIN_USER_ID) aufgerufen werden – wird serverseitig
// anhand des mitgeschickten JWTs geprüft, nicht nur im Frontend.
//
// Deploy:
//   supabase functions deploy admin-create-user
//   supabase secrets set ADMIN_USER_ID=2294dbf3-e62a-4eaf-b419-0b03cb30635f
//
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY sind in Edge Functions bereits
// automatisch als Umgebungsvariablen vorhanden, dafür ist nichts zu tun.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const ADMIN_USER_ID = Deno.env.get('ADMIN_USER_ID')!;

        // 1) Aufrufer anhand des mitgesendeten JWTs identifizieren
        const authHeader = req.headers.get('Authorization') ?? '';
        const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
            global: { headers: { Authorization: authHeader } }
        });
        const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();

        if (callerError || !caller) {
            return new Response(JSON.stringify({ error: 'Nicht angemeldet' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2) Nur der Admin darf Konten anlegen
        if (caller.id !== ADMIN_USER_ID) {
            return new Response(JSON.stringify({ error: 'Keine Berechtigung' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3) Eingaben prüfen
        const { name, username, password } = await req.json();

        if (!name || !username || !password) {
            return new Response(JSON.stringify({ error: 'Bitte alle Felder ausfüllen' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            return new Response(JSON.stringify({ error: 'Benutzername: 3–20 Zeichen, nur Kleinbuchstaben/Zahlen/_' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        if (password.length < 6) {
            return new Response(JSON.stringify({ error: 'Passwort muss mindestens 6 Zeichen haben' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 4) Mit erhöhten Rechten (Service-Role) den Nutzer anlegen.
        // Supabase Auth braucht intern immer eine E-Mail — da der Login hier
        // ausschließlich über den Benutzernamen läuft, wird eine interne,
        // nicht zustellbare Platzhalter-Adresse aus dem Benutzernamen erzeugt.
        // Der Nutzer kann später selbst eine echte E-Mail für "Passwort
        // vergessen" hinterlegen (siehe set-user-email Funktion).
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const internalEmail = `${username}@oneplan.internal`;

        const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();
        if (existingProfile) {
            return new Response(JSON.stringify({ error: 'Benutzername bereits vergeben' }), {
                status: 409,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            email: internalEmail,
            password,
            email_confirm: true, // Konto ist sofort nutzbar, keine Bestätigungsmail nötig
            user_metadata: { name, username }
        });

        if (createError) {
            return new Response(JSON.stringify({ error: createError.message }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { error: profileError } = await adminClient.from('profiles').insert({
            id: created.user.id,
            name,
            username,
            email: internalEmail
        });

        if (profileError) {
            // Auth-Nutzer existiert zwar schon, aber ohne Profil-Zeile melden wir den Fehler trotzdem zurück
            return new Response(JSON.stringify({ error: 'Nutzer angelegt, aber Profil fehlgeschlagen: ' + profileError.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: true, userId: created.user.id }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
