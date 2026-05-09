import { useEffect, useState } from 'react'
import api from '../api'
import { formData } from '../formData'

const formTitle = import.meta.env.VITE_FORM_TITLE || 'Apply Now'
const formNote =
  import.meta.env.VITE_FORM_NOTE ||
  'I agree to receive information regarding my submitted enquiry and future admission updates.'

function createCaptcha() {
  return Math.random().toString(36).slice(2, 8)
}

function ApplicationFormPage() {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    otp: '',
    country: 'IN',
    state: '',
    district: '',
    department: '',
    level: '',
    course: '',
    captchaInput: '',
    agreedToUpdates: false,
  })
  const [states, setStates] = useState(formData.states)
  const [districts, setDistricts] = useState([])
  const [courses, setCourses] = useState([])
  const [captcha, setCaptcha] = useState(createCaptcha())
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [submitMessage, setSubmitMessage] = useState('')
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (formValues.country !== 'IN') {
      setStates([])
      setDistricts([])
      setFormValues((current) => ({ ...current, state: '', district: '' }))
      return
    }

    setStates(formData.states)
  }, [formValues.country])

  useEffect(() => {
    if (!formValues.state) {
      setDistricts([])
      setFormValues((current) => ({ ...current, district: '' }))
      return
    }

    const matchedState = formData.states.find((state) => state.value === formValues.state)
    setDistricts(matchedState?.districts ?? [])
  }, [formValues.state])

  useEffect(() => {
    if (!formValues.department) {
      setCourses([])
      setFormValues((current) => ({ ...current, course: '' }))
      return
    }

    setCourses(formData.courseOptions[formValues.department] ?? [])
  }, [formValues.department])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setFormValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (name === 'mobile' || name === 'countryCode') {
      setOtpVerified(false)
    }
  }

  async function handleSendOtp() {
    setOtpMessage('')
    setSubmitMessage('')
    setIsSendingOtp(true)

    try {
      const response = await api.post('/otp/send', {
        mobile: formValues.mobile,
        countryCode: formValues.countryCode,
      })

      setOtpMessage(response.data.message)
    } catch (error) {
      setOtpMessage(error.response?.data?.message || 'Failed to send OTP.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    setOtpMessage('')
    setIsVerifyingOtp(true)

    try {
      const response = await api.post('/otp/verify', {
        mobile: formValues.mobile,
        countryCode: formValues.countryCode,
        otp: formValues.otp,
      })

      setOtpVerified(true)
      setOtpMessage(response.data.message)
    } catch (error) {
      setOtpVerified(false)
      setOtpMessage(error.response?.data?.message || 'OTP verification failed.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitMessage('')

    if (formValues.captchaInput.toLowerCase() !== captcha.toLowerCase()) {
      setSubmitMessage('Captcha does not match.')
      return
    }

    if (!otpVerified) {
      setSubmitMessage('Please verify OTP before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await api.post('/forms', {
        name: formValues.name,
        email: formValues.email,
        mobile: formValues.mobile,
        countryCode: formValues.countryCode,
        otpVerified,
        country: formData.countryMap[formValues.country] || formValues.country,
        state: formValues.state,
        district: formValues.district,
        department: formValues.department,
        level: formValues.level,
        course: formValues.course,
        captcha: formValues.captchaInput,
        agreedToUpdates: formValues.agreedToUpdates,
      })

      setSubmitMessage(response.data.message)
      setFormValues({
        name: '',
        email: '',
        countryCode: '+91',
        mobile: '',
        otp: '',
        country: 'IN',
        state: '',
        district: '',
        department: '',
        level: '',
        course: '',
        captchaInput: '',
        agreedToUpdates: false,
      })
      setOtpVerified(false)
      setCaptcha(createCaptcha())
    } catch (error) {
      setSubmitMessage(error.response?.data?.message || 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="hero-shell">
      <section className="hero-banner">
        <div className="hero-overlay" />

        <div className="form-popup">
          <div className="form-header">
            <h1>{formTitle}</h1>
          </div>

          <form className="bank-form" onSubmit={handleSubmit}>
            <div className="field-row full-width">
              <label>
                <input name="name" value={formValues.name} onChange={handleChange} type="text" placeholder="Enter Name *" />
              </label>
            </div>

            <div className="field-row full-width">
              <label>
                <input
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Enter Email Address *"
                />
              </label>
            </div>

            <div className="field-row full-width phone-row">
              <label className="country-prefix">
                <select name="countryCode" value={formValues.countryCode} onChange={handleChange}>
                  <option value="+91">+91</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+61">+61</option>
                </select>
              </label>

              <label className="phone-input">
                <input
                  name="mobile"
                  value={formValues.mobile}
                  onChange={handleChange}
                  type="tel"
                  placeholder="Enter Mobile Number *"
                />
              </label>
            </div>

            <div className="field-row full-width otp-actions-row">
              <button className="secondary-action" type="button" onClick={handleSendOtp} disabled={isSendingOtp}>
                {isSendingOtp ? 'Sending...' : 'Send OTP'}
              </button>
              <div className="otp-row">
                <input name="otp" value={formValues.otp} onChange={handleChange} type="text" placeholder="Enter OTP" />
                <button className="verify-button" type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp}>
                  {isVerifyingOtp ? 'Verifying' : 'Verify'}
                </button>
              </div>
            </div>

            <label>
              <select name="country" value={formValues.country} onChange={handleChange}>
                <option value="">Select Country *</option>
                {formData.countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select name="state" value={formValues.state} onChange={handleChange} disabled={formValues.country !== 'IN' || !states.length}>
                <option value="">{formValues.country === 'IN' ? 'Select State *' : 'Available for India'}</option>
                {states.map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select name="district" value={formValues.district} onChange={handleChange} disabled={!districts.length}>
                <option value="">{districts.length ? 'Select District *' : 'Select state first'}</option>
                {districts.map((district) => (
                  <option key={district.value} value={district.value}>
                    {district.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select name="department" value={formValues.department} onChange={handleChange}>
                <option value="">Select Department *</option>
                {formData.departments.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select name="level" value={formValues.level} onChange={handleChange}>
                <option value="">Select Level *</option>
                {formData.levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row full-width">
              <label>
                <select name="course" value={formValues.course} onChange={handleChange} disabled={!courses.length}>
                  <option value="">{courses.length ? 'Select Course *' : 'Select department first'}</option>
                  {courses.map((course) => (
                    <option key={course.value} value={course.value}>
                      {course.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row full-width captcha-row">
              <div className="captcha-box">
                <span>{captcha}</span>
                <button className="captcha-refresh" type="button" onClick={() => setCaptcha(createCaptcha())}>
                  Refresh
                </button>
              </div>
              <label>
                <input
                  name="captchaInput"
                  value={formValues.captchaInput}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter Captcha"
                />
              </label>
            </div>

            {otpMessage ? <p className="status-message">{otpMessage}</p> : null}
            {submitMessage ? <p className="status-message">{submitMessage}</p> : null}

            <div className="full-width form-footer">
              <label className="agree-row agree-row-single">
                <input
                  name="agreedToUpdates"
                  checked={formValues.agreedToUpdates}
                  onChange={handleChange}
                  type="checkbox"
                />
                <span>{formNote}</span>
              </label>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default ApplicationFormPage
