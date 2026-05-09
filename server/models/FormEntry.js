import mongoose from 'mongoose'

const formEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true },
    otpVerified: { type: Boolean, required: true, default: false },
    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    captcha: { type: String, required: true, trim: true },
    agreedToUpdates: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('FormEntry', formEntrySchema)
