import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const LOGIN_EMAIL = 'suresh@erd.invalid'

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const constantTimeEquals = (provided: string, expected: string) => {
  const encoder = new TextEncoder()
  const providedBytes = encoder.encode(provided)
  const expectedBytes = encoder.encode(expected)
  let difference = providedBytes.length ^ expectedBytes.length
  const length = Math.max(providedBytes.length, expectedBytes.length)

  for (let index = 0; index < length; index += 1) {
    difference |= (providedBytes[index] ?? 0) ^ (expectedBytes[index] ?? 0)
  }

  return difference === 0
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const expectedUsername = Deno.env.get('APP_LOGIN_USERNAME')
  const expectedPassword = Deno.env.get('APP_LOGIN_PASSWORD')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!expectedUsername || !expectedPassword || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Sign-in is not configured.' }, 500)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  if (
    typeof body !== 'object' || body === null ||
    !('username' in body) || typeof body.username !== 'string' || body.username.length > 256 ||
    !('password' in body) || typeof body.password !== 'string' || body.password.length > 1024
  ) {
    return jsonResponse({ error: 'Invalid request.' }, 400)
  }

  if (
    !constantTimeEquals(body.username, expectedUsername) ||
    !constantTimeEquals(body.password, expectedPassword)
  ) {
    return jsonResponse({ error: 'Invalid username or password.' }, 401)
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: LOGIN_EMAIL,
      password: expectedPassword,
      email_confirm: true,
      user_metadata: { display_name: 'SRI KANDHAN AUTOS' },
    })

    let accountId = created.user?.id
    if (!accountId && createError) {
      const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) throw listError
      accountId = listed.users.find((account) => account.email === LOGIN_EMAIL)?.id
      if (!accountId) throw createError
    }

    if (!accountId) throw new Error('Unable to provision the shop account.')

    const { error: passwordError } = await admin.auth.admin.updateUserById(accountId, {
      password: expectedPassword,
      email_confirm: true,
      user_metadata: { display_name: 'SRI KANDHAN AUTOS' },
    })
    if (passwordError) throw passwordError

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: LOGIN_EMAIL,
    })
    if (linkError || !linkData.properties?.hashed_token) {
      throw linkError ?? new Error('Unable to create a sign-in session.')
    }

    return jsonResponse({ token_hash: linkData.properties.hashed_token })
  } catch {
    return jsonResponse({ error: 'Unable to sign in right now.' }, 500)
  }
})