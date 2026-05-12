import express from 'express'
import XLSX from 'xlsx'
import FormEntry from '../models/FormEntry.js'
import { requireAdminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

const requiredFields = [
  ['name', 'Name'],
  ['dob', 'Date of birth'],
  ['mobile', 'Mobile number'],
  ['countryCode', 'Country code'],
  ['parentMobile', 'Parent mobile number'],
  ['email', 'Email'],
  ['schoolName', 'School name'],
  ['city', 'City'],
  ['state', 'State'],
  ['studentClass', 'Class'],
]

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : value
}

function isMissing(value) {
  return value === undefined || value === null || cleanText(value) === ''
}

function isTrue(value) {
  return value === true || value === 'true'
}

router.post('/', async (request, response) => {
  try {
    const form = Object.fromEntries(
      Object.entries(request.body || {}).map(([key, value]) => [key, cleanText(value)]),
    )

    const missingFields = requiredFields
      .filter(([key]) => isMissing(form[key]))
      .map(([, label]) => label)

    if (!isTrue(form.indemnityAgreed)) {
      missingFields.push('Indemnity & Consent Declaration')
    }

    if (missingFields.length > 0) {
      return response.status(400).json({
        message: `Please complete: ${missingFields.join(', ')}.`,
        missingFields,
      })
    }

    if (!isTrue(form.otpVerified)) {
      return response.status(400).json({ message: 'OTP verification is required.' })
    }

    const entry = await FormEntry.create({
      name: form.name,
      dob: new Date(form.dob),
      mobile: form.mobile,
      countryCode: form.countryCode,
      otpVerified: true,
      parentMobile: form.parentMobile,
      email: form.email,
      schoolName: form.schoolName,
      city: form.city,
      state: form.state,
      studentClass: form.studentClass,
      indemnityAgreed: true,
    })

    response.status(201).json({ message: 'Registration submitted successfully.', entry })
  } catch (error) {
    if (error.name === 'ValidationError') {
      return response.status(400).json({ message: 'Please complete all required fields correctly.' })
    }

    if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
      console.error('Database connection error:', error)
      return response.status(503).json({ message: 'Database is not reachable. Check MongoDB connection.' })
    }

    console.error('Form submission error:', error)
    response.status(500).json({ message: 'Submission failed. Please try again.' })
  }
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
      DOB: entry.dob,
      Mobile: `${entry.countryCode}${entry.mobile}`,
      ParentMobile: entry.parentMobile,
      Email: entry.email,
      SchoolName: entry.schoolName,
      City: entry.city,
      State: entry.state,
      Class: entry.studentClass,
      IndemnityAgreed: entry.indemnityAgreed ? 'Yes' : 'No',
      SubmittedAt: entry.createdAt,
    })),
  )

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  response.setHeader(
    'Content-Disposition',
    'attachment; filename="futurex-bootcamp-registrations.xlsx"',
  )
  response.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  response.send(buffer)
})

export default router
