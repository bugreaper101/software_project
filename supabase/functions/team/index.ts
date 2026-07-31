import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TeamInput {
  email: string;
  role: "admin" | "manager" | "staff";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Create a client that honors the caller's JWT so RLS + app_metadata checks apply
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const callerRole = userData.user.app_metadata?.role ?? "guest";
    if (callerRole !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const url = new URL(req.url);
    const method = req.method;
    const id = url.searchParams.get("id");

    // ---- LIST ----
    if (method === "GET") {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ team: data }, 200);
    }

    // ---- CREATE / INVITE ----
    if (method === "POST") {
      const body = (await req.json()) as TeamInput;
      const email = body.email?.trim().toLowerCase();
      const role = body.role;
      if (!email || !["admin", "manager", "staff"].includes(role)) {
        return json({ error: "Invalid email or role" }, 400);
      }
      const { data, error } = await supabase
        .from("team_members")
        .upsert({ email, role, status: "invited" }, { onConflict: "email" })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ member: data }, 201);
    }

    // ---- UPDATE ROLE ----
    if (method === "PUT" && id) {
      const body = (await req.json()) as Partial<TeamInput>;
      const patch: Record<string, string> = {};
      if (body.role && ["admin", "manager", "staff"].includes(body.role)) patch.role = body.role;
      if (body.email) patch.email = body.email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("team_members")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);

      // If the member has a linked user, refresh their app_metadata role
      if (data.user_id && patch.role) {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        await adminClient.auth.admin.updateUserById(data.user_id, {
          appMetadata: { role: patch.role },
        });
      }
      return json({ member: data }, 200);
    }

    // ---- DELETE / REMOVE ----
    if (method === "DELETE" && id) {
      // Fetch first so we can strip the role from a linked user
      const { data: existing } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("id", id)
        .maybeSingle();
      if (existing?.user_id) {
        const adminClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );
        await adminClient.auth.admin.updateUserById(existing.user_id, {
          appMetadata: { role: "guest" },
        });
      }
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true }, 200);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
