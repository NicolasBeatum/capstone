// @ts-expect-error Deno resolves the npm: specifier when deploying this Edge Function.
import { createClient } from 'npm:@supabase/supabase-js@2';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return new Response('Método no permitido', { status: 405, headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !publishableKey || !serviceRoleKey) {
    return new Response('No autorizado', { status: 401, headers: corsHeaders });
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response('No autorizado', { status: 401, headers: corsHeaders });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: eraseError } = await adminClient.rpc('erase_student_personal_data', {
    p_auth_user_id: userData.user.id,
  });
  if (eraseError) {
    return new Response('No se pudo eliminar la información personal.', {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userData.user.id);
  if (deleteUserError) {
    return new Response('La solicitud quedó pendiente. Vuelve a intentarlo.', {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(null, { status: 204, headers: corsHeaders });
});