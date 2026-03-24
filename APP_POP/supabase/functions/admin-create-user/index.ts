import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const authHeader = req.headers.get("Authorization") ?? "";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const requestClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await requestClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from("usuarios_sistema")
      .select("perfil, ativo")
      .eq("auth_user_id", caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.perfil !== "ADMIN_POP" || callerProfile.ativo === false) {
      return new Response(JSON.stringify({ error: "Acesso restrito a ADMIN_POP." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { nome, email, password, perfil } = await req.json();

    if (!nome || !email || !password || !perfil) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["ADMIN_POP", "CONSULTA_POP"].includes(perfil)) {
      return new Response(JSON.stringify({ error: "Perfil inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        perfil,
      },
    });

    if (createError) {
      throw createError;
    }

    const { error: syncError } = await adminClient.from("usuarios_sistema").upsert(
      {
        auth_user_id: createdUser.user.id,
        nome,
        email,
        perfil,
        ativo: true,
      },
      { onConflict: "auth_user_id" },
    );

    if (syncError) {
      throw syncError;
    }

    return new Response(JSON.stringify({ success: true, auth_user_id: createdUser.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message ?? "Erro interno." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
