import express from 'express'
import multer from 'multer'
import path from 'path'
import XLSX from 'xlsx'
import FormEntry from '../models/FormEntry.js'
import { requireAdminAuth } from '../middleware/adminAuth.js'

const router = express.Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'id-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf']
  const ext = path.extname(file.originalname).toLowerCase()
  if (allowedTypes.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error('Only .jpg, .jpeg, .png, and .pdf files are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 } // 1 MB
})

router.post('/', upload.single('idDocument'), async (request, response) => {
  try {
    const {
      name,
      dob,
      mobile,
      countryCode,
      otpVerified,
      parentMobile,
      email,
      schoolName,
      city,
      state,
      studentClass,
      indemnityAgreed,
    } = request.body

    if (
      !name ||
      !dob ||
      !mobile ||
      !countryCode ||
      !parentMobile ||
      !email ||
      !schoolName ||
      !city ||
      !state ||
      !studentClass ||
      !indemnityAgreed
    ) {
      return response.status(400).json({ message: 'Please complete all required fields.' })
    }

    if (!otpVerified || otpVerified === 'false') {
      return response.status(400).json({ message: 'OTP verification is required.' })
    }

    if (!request.file) {
      return response.status(400).json({ message: 'ID document upload is required.' })
    }

    const entry = await FormEntry.create({
      name,
      dob: new Date(dob),
      mobile,
      countryCode,
      otpVerified: otpVerified === 'true' || otpVerified === true,
      parentMobile,
      email,
      schoolName,
      city,
      state,
      studentClass,
      idDocumentPath: request.file.path,
      idDocumentOriginalName: request.file.originalname,
      indemnityAgreed: indemnityAgreed === 'true' || indemnityAgreed === true,
    })

    response.status(201).json({ message: 'Registration submitted successfully.', entry })
  } catch (error) {
    if (error.message.includes('file size')) {
      return response.status(400).json({ message: 'File size must be less than 1 MB.' })
    }
    if (error.message.includes('Only .jpg')) {
      return response.status(400).json({ message: error.message })
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
      IDDocument: entry.idDocumentOriginalName,
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
