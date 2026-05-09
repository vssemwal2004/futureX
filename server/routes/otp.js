import axios from 'axios'
import express from 'express'
import { saveOtp, verifyOtp } from '../utils/otpStore.js'

const router = express.Router()

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

router.post('/send', async (request, response) => {
  const { mobile, countryCode } = request.body

  if (!mobile || !countryCode) {
    return response.status(400).json({ message: 'Mobile and country code are required.' })
  }

  const otp = generateOtp()
  const fullPhone = `${countryCode}${mobile}`

  try {
    if (process.env.MSG91_AUTH_KEY) {
      await axios.post(
        'https://control.msg91.com/api/v5/otp',
        {
          mobile: fullPhone.replace('+', ''),
          authkey: process.env.MSG91_AUTH_KEY,
          otp,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }

    saveOtp(fullPhone, otp)
    response.json({ message: 'OTP sent successfully.' })
  } catch (error) {
    response.status(500).json({
      message: 'Failed to send OTP.',
      details: error.response?.data || error.message,
    })
  }
})

router.post('/verify', (request, response) => {
  const { mobile, countryCode, otp } = request.body

  if (!mobile || !countryCode || !otp) {
    return response.status(400).json({ message: 'Mobile, country code, and OTP are required.' })
  }

  const fullPhone = `${countryCode}${mobile}`
  const isValid = verifyOtp(fullPhone, otp)

  if (!isValid) {
    return response.status(400).json({ message: 'Invalid or expired OTP.' })
  }

  response.json({ message: 'OTP verified successfully.' })
})

export default router
