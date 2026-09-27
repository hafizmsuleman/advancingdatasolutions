import * as React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

// Shared branded layout for every booking email. The body is the plain text
// stored on the Outbox row; links on their own line become buttons.
export const SITE = 'https://advancingdatasolutions.lovable.app'
export const LOGO = `${SITE}/email-logo.png`
const SIGNATURE = 'The Advancing Data Solutions team'
const URL_RE = /(https?:\/\/[^\s]+)/

export function labelFor(url: string) {
  if (/meet\.google|zoom\.us|teams\.microsoft/.test(url)) return 'Join the meeting'
  if (url.includes('calendar.google.com')) return 'Add to Google Calendar'
  if (url.includes('/nda/')) return 'Sign the NDA'
  if (url.includes('/attend/')) return 'Confirm attendance'
  if (url.includes('/reschedule/')) return 'Choose another time'
  if (url.includes('/cancel/')) return 'Cancel booking'
  if (url.includes('/booked/')) return 'View your booking'
  if (url.includes('/book?t=')) return 'Pick a time'
  if (url.includes('/admin')) return 'Open in admin'
  if (url.endsWith('/book')) return 'Book a new time'
  return 'Open link'
}

/** Drop trailing sign-off lines; the layout adds one consistent signature. */
export function stripSignature(body: string) {
  const lines = body.replace(/\r/g, '').trimEnd().split('\n')
  while (lines.length) {
    const l = lines[lines.length - 1]!.trim()
    if (l === '' || /^(the )?advancing data solutions( team)?$/i.test(l) || /^speak soon,?$/i.test(l)) lines.pop()
    else break
  }
  return lines.join('\n')
}

type Block = { kind: 'text'; text: string } | { kind: 'button'; url: string; label: string; text?: string }

export function toBlocks(body: string): Block[] {
  const out: Block[] = []
  for (const para of stripSignature(body).split(/\n{2,}/)) {
    const buf: string[] = []
    for (const line of para.split('\n')) {
      const m = line.match(URL_RE)
      if (!m) { buf.push(line); continue }
      const before = line.replace(m[0], '').trim().replace(/:$/, '').trim()
      if (before) buf.push(before)
      if (buf.length) out.push({ kind: 'text', text: buf.splice(0).join('\n') })
      out.push({ kind: 'button', url: m[0], label: labelFor(m[0]) })
    }
    if (buf.length && buf.join('').trim()) out.push({ kind: 'text', text: buf.join('\n') })
  }
  return out
}

interface Props { subject?: string; body?: string; heading?: string }

export function BrandedEmail({ subject = '', body = '', heading }: Props) {
  const blocks = toBlocks(body)
  let buttons = 0
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 0 24px' }}>
            <Img src={LOGO} alt="Advancing Data Solutions" width="174" height="48" />
          </Section>
          <Section style={card}>
            <Heading style={h1}>{heading || subject}</Heading>
            {blocks.map((b, i) => {
              if (b.kind === 'text') return <Text key={i} style={text}>{b.text}</Text>
              const primary = buttons++ === 0
              return (
                <Section key={i} style={{ margin: '0 0 16px' }}>
                  {primary
                    ? <Button href={b.url} style={button}>{b.label}</Button>
                    : <Link href={b.url} style={link}>{b.label} →</Link>}
                </Section>
              )
            })}
            <Text style={{ ...text, margin: '24px 0 0' }}>{SIGNATURE}</Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Advancing Data Solutions LLC · AI, data and web engineering<br />
            Questions? Just reply to this email or write to contact@advancingdatasolutions.com.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function branded(displayName: string, heading: string, previewBody: string, to?: string): TemplateEntry {
  return {
    component: (p: Props) => <BrandedEmail {...p} heading={heading} />,
    subject: (d) => (d['subject'] as string) || heading,
    displayName,
    previewData: { subject: heading, body: previewBody },
    ...(to ? { to } : {}),
  }
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, Segoe UI, Arial, sans-serif', margin: 0 }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 20px' }
const card = { border: '1px solid #E7E5E4', borderRadius: '12px', padding: '28px 28px 24px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '22px', fontWeight: 600 as const, letterSpacing: '-0.01em', color: '#1B3860', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '16px', color: '#57534E', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: '#2A5298', color: '#ffffff', fontSize: '16px', fontWeight: 600 as const, borderRadius: '10px', padding: '12px 22px', textDecoration: 'none', display: 'inline-block' }
const link = { color: '#2A5298', fontSize: '15px', fontWeight: 600 as const, textDecoration: 'underline' }
const hr = { borderColor: '#E7E5E4', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#78716C', lineHeight: '1.6', margin: 0 }
