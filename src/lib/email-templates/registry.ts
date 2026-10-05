import type { ComponentType } from 'react'
import { branded } from './branded'
import { template as verificationCode } from './verification-code'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

const S = 'https://advancingdatasolutions.lovable.app'
const T = 'abc123def456abc123def456'

/** One template per Outbox message type (see src/lib/mailer.server.ts). */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'verification-code': verificationCode,
  'confirmation': branded('Booking confirmation', "You're booked", `Hi Megan,\n\nThanks for booking a free 60-minute consultation with our engineers. Your call is on Tuesday, 6 October 2026 at 10:00 (your time).\n\nMeeting link: https://meet.google.com/abc-defg-hij\n\nAdd it to your calendar: https://calendar.google.com/calendar/render?action=TEMPLATE\n\nPlease sign our short mutual NDA before the call: ${S}/nda/${T}\n\nNeed another time? ${S}/reschedule/${T}\n\nCan't make it? ${S}/cancel/${T}`),
  'admin-new-booking': branded('Admin: new booking', 'New booking', `Megan Holloway from Northwind Logistics booked a 60-minute consultation.\n\nYour time: Tue 6 Oct, 19:00\nClient's time (New York): Tue 6 Oct, 10:00\n\n${S}/admin/bookings`),
  'nda-reminder': branded('NDA reminder', 'Please sign the NDA', `Hi Megan,\n\nSo you can share details freely on the call, please sign our short mutual NDA before your consultation:\n${S}/nda/${T}`),
  'reminder-24h': branded('24-hour reminder', 'Your consultation is tomorrow', `Hi Megan,\n\nYour free 60-minute consultation with our engineers is tomorrow.\n\nPlease confirm you can attend:\n${S}/attend/${T}\n\nNeed another time? ${S}/reschedule/${T}`),
  'reminder-1h': branded('1-hour reminder', 'Starting in 1 hour', `Hi Megan,\n\nYour consultation starts in one hour.\n\nMeeting link: https://meet.google.com/abc-defg-hij`),
  'release-notice': branded('Release notice', "We've released your time", `Hi Megan,\n\nWe didn't receive your attendance confirmation, so we've released your consultation time.\n\nYou're welcome to choose a new time:\n${S}/book`),
  'reschedule-notice': branded('Reschedule notice', 'Your consultation has moved', `Hi Megan,\n\nYour consultation is now on Thursday, 8 October 2026 at 11:00 (your time). The meeting link stays the same.\n\n${S}/booked/${T}`),
  'cancel-notice': branded('Cancel notice', 'Your consultation is cancelled', `Your consultation has been cancelled and the time released. You're welcome to book a new time whenever suits you:\n${S}/book`),
  'nudge': branded('Nudge', 'Your free consultation', `Hi Megan,\n\nWe noticed you haven't picked a time yet. Your details are saved, so booking takes under a minute:\n${S}/book?t=${T}`),
  'admin-alert': branded('Admin alert', 'Needs your attention', `Megan Holloway from Northwind Logistics hasn't confirmed attendance.`),
}
TEMPLATES['no-show-notice'] = branded('No-show follow-up', 'Sorry we missed you', `Hi Megan,\n\nWe were ready for your free consultation on Tuesday 29 September, 4:00 PM (New York time), but we weren't able to connect.\n\nIf you'd still like to talk, you're welcome to choose a new time that suits you.\n\n${S}/book`)
