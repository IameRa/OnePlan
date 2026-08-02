// Edge Function: login-with-username
//
// Erlaubt den Login per Benutzername statt E-Mail. Supabase Auth selbst
// kennt intern nur E-Mail-Login — diese Funktion löst den Benutzernamen
// serverseitig (mit Service-Role, ohne die E-Mail jemals an den Client
// zu schicken) auf die hinterlegte E-Mail auf und prüft dann das Passwort.
// Bei Erfolg wird die entstandene Session (access/refresh token) an den
// Client zurückgegeben, der sie per supabase.auth.setSession(...) übernimmt.
//
// Deploy:
//   supabase functions deploy login-with-username
//
// SUPABASE_URL, SUPABASE_ANON_KEY und SUPABASE_SERVICE_ROLE_KEY sind in
// Edge Functions automatisch als Umgebungsvariablen vorhanden.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Bewusst immer dieselbe Fehlermeldung, egal ob der Benutzername nicht
// existiert oder das Passwort falsch ist (kein Konten-Enumeration).
const INVALID = () => new Response(JSON.stringify({ error: 'Benutzername oder Passwort falsch' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

        const { username, password } = await req.json();
        if (!username || !password) return INVALID();

        // 1) Benutzernamen -> hinterlegte E-Mail auflösen (nur serverseitig sichtbar)
        // ilike statt eq: robust, falls der Benutzername in der DB (z.B. durch
        // manuelles Anlegen im Supabase-Dashboard) mit anderer Groß-/
        // Kleinschreibung gespeichert wurde.
        const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
        const { data: profile } = await adminClient
            .from('profiles')
            .select('email')
            .ilike('username', String(username).trim())
            .maybeSingle();

        if (!profile?.email) return INVALID();

        // 2) Passwort ganz normal über den Auth-Server prüfen
        const anonClient = createClient(SUPABASE_URL, ANON_KEY);
        const { data, error } = await anonClient.auth.signInWithPassword({
            email: profile.email,
            password
        });

        if (error || !data.session) return INVALID();

        return new Response(JSON.stringify({ success: true, session: data.session }), {
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
