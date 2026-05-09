import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import authRouter from './routes/auth.js'
import formsRouter from './routes/forms.js'
import otpRouter from './routes/otp.js'

dotenv.config()

const app = express()
const port = Number(process.env.SERVER_PORT || 4000)

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
)
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/forms', formsRouter)
app.use('/api/otp', otpRouter)

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
