import { Resend } from 'resend'
import type { NextRequest } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const { name, email, msg } = await request.json()

  if (!name || !email || !msg) {
    return Response.json({ ok: false, error: 'All fields are required.' }, { status: 400 })
  }

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'RESEND_API_KEY is not configured.' }, { status: 500 })
  }

  const { error } = await resend.emails.send({
    from: 'Arcade Vault <onboarding@resend.dev>',
    to: 'test@gmail.com',
    subject: `[Arcade Vault] Mensaje de ${name}`,
    text: `De: ${name} <${email}>\n\n${msg}`,
  })

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
