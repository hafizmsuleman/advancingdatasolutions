import * as React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO = 'https://advancingdatasolutions.lovable.app/email-logo.png'

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Set a new password for Advancing Data Solutions</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ padding: '0 0 24px' }}>
          <Img src={LOGO} alt="Advancing Data Solutions" width="174" height="48" />
        </Section>
        <Section style={card}>
          <Heading style={h1}>Set a new password</Heading>
          <Text style={text}>
            We received a request to reset the password for your Advancing Data Solutions admin account. Use the button below to choose a new one.
          </Text>
          <Button style={button} href={confirmationUrl}>Set new password</Button>
          <Text style={{ ...text, margin: '20px 0 0' }}>
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </Text>
          <Text style={{ ...text, margin: '24px 0 0' }}>The Advancing Data Solutions team</Text>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>Advancing Data Solutions LLC · AI, data and web engineering</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, Segoe UI, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 20px' }
const card = { border: '1px solid #E7E5E4', borderRadius: '12px', padding: '28px' }
const h1 = { fontSize: '22px', fontWeight: 600 as const, color: '#1B3860', margin: '0 0 16px' }
const text = { fontSize: '16px', color: '#57534E', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#2A5298', color: '#ffffff', fontSize: '16px', fontWeight: 600 as const, borderRadius: '10px', padding: '12px 22px', textDecoration: 'none' }
const hr = { borderColor: '#E7E5E4', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#78716C', margin: 0 }
