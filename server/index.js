import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import fs from 'fs'
import mongoose from 'mongoose'
import path from 'path'
import authRouter from './routes/auth.js'
import formsRouter from './routes/forms.js'
import otpRouter from './routes/otp.js'

dotenv.config()

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app = express()
const port = Number(process.env.SERVER_PORT || 4000)
const clientOrigin = getClientOrigin(process.env.CLIENT_ORIGIN || 'http://localhost:5173')

app.use(
  cors({
    origin: clientOrigin,
  }),
)
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/forms', formsRouter)
app.use('/api/otp', otpRouter)

function getClientOrigin(value) {
  try {
    return new URL(value).origin
  } catch {
    return value
  }
}

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()
