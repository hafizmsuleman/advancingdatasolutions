import * as React from 'react'
import { Body, Container, Head, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

// Deliberately short and plain: no logo, links or marketing.
interface Props { body?: string }

function parse(body = '') {
  const code = body.match(/\b(\d{6})\b/)?.[1] ?? '------'
  const name = body.match(/^Hi ([^,\n]+),/)?.[1] ?? 'there'
  return { code, name }
}

const VerificationCodeEmail = ({ body }: Props) => {
  const { code, name } = parse(body)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your verification code is {code}</Preview>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, Segoe UI, Arial, sans-serif' }}>
        <Container style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 20px' }}>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>Your Advancing Data Solutions verification code is:</Text>
          <Text style={codeStyle}>{code}</Text>
          <Text style={text}>It expires in 10 minutes. If you didn't request this, you can ignore this email.</Text>
          <Text style={text}>The Advancing Data Solutions team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: VerificationCodeEmail,
  subject: 'Your verification code',
  displayName: 'Verification code',
  previewData: { body: 'Hi Megan,\n\nYour Advancing Data Solutions verification code is 482913. It expires in 10 minutes.' },
} satisfies TemplateEntry

const text = { fontSize: '16px', color: '#1C1917', lineHeight: '1.6', margin: '0 0 14px' }
const codeStyle = { fontSize: '32px', fontWeight: 700 as const, letterSpacing: '0.3em', color: '#1B3860', margin: '8px 0 20px', fontVariantNumeric: 'tabular-nums' as const }
