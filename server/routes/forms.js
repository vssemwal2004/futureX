import express from 'express'
import XLSX from 'xlsx'
import FormEntry from '../models/FormEntry.js'
import { requireAdminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

router.post('/', async (request, response) => {
  const {
    name,
    email,
    mobile,
    countryCode,
    otpVerified,
    country,
    state,
    district,
    department,
    level,
    course,
    captcha,
    agreedToUpdates,
  } = request.body

  if (
    !name ||
    !email ||
    !mobile ||
    !countryCode ||
    !country ||
    !state ||
    !district ||
    !department ||
    !level ||
    !course ||
    !captcha ||
    !agreedToUpdates
  ) {
    return response.status(400).json({ message: 'Please complete all required fields.' })
  }

  if (!otpVerified) {
    return response.status(400).json({ message: 'OTP verification is required.' })
  }

  const entry = await FormEntry.create({
    name,
    email,
    mobile,
    countryCode,
    otpVerified,
    country,
    state,
    district,
    department,
    level,
    course,
    captcha,
    agreedToUpdates,
  })

  response.status(201).json({ message: 'Form submitted successfully.', entry })
})

router.get('/', requireAdminAuth, async (_request, response) => {
  const entries = await FormEntry.find().sort({ createdAt: -1 }).lean()
  response.json(entries)
})

router.get('/export', requireAdminAuth, async (_request, response) => {
  const entries = await FormEntry.find().sort({ createdAt: -1 }).lean()

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(
    entries.map((entry) => ({
      Name: entry.name,
      Email: entry.email,
      Mobile: `${entry.countryCode}${entry.mobile}`,
      Country: entry.country,
      State: entry.state,
      District: entry.district,
      Department: entry.department,
      Level: entry.level,
      Course: entry.course,
      SubmittedAt: entry.createdAt,
    })),
  )

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  response.setHeader(
    'Content-Disposition',
    'attachment; filename=\"futurex-applications.xlsx\"',
  )
  response.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  response.send(buffer)
})

export default router
