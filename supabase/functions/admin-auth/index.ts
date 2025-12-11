import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHash } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function generateId(): string {
  return crypto.randomUUID();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, email, password } = await req.json();

    if (action === 'signup') {
      const { count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

      const isFirstAdmin = count === 0;
      const adminId = generateId();
      const passwordHash = hashPassword(password);

      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          id: adminId,
          email,
          password_hash: passwordHash,
          created_by: isFirstAdmin ? null : adminId,
          is_active: true,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      return new Response(
        JSON.stringify({ success: true, userId: adminId }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (action === 'login') {
      const passwordHash = hashPassword(password);

      const { data: admin, error: queryError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .maybeSingle();

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (!admin) {
        throw new Error('Invalid email or password');
      }

      return new Response(
        JSON.stringify({ success: true, userId: admin.id }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      throw new Error('Invalid action');
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Authentication failed' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});