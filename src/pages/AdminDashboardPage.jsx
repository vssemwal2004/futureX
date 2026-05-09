import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('futurex_admin_token')

    if (!token) {
      navigate('/admin')
      return
    }

    api
      .get('/forms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => setEntries(response.data))
      .catch(() => {
        localStorage.removeItem('futurex_admin_token')
        setMessage('Session expired. Please login again.')
        navigate('/admin')
      })
  }, [navigate])

  async function handleDownload() {
    const token = localStorage.getItem('futurex_admin_token')
    const response = await api.get('/forms/export', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'blob',
    })

    const url = URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = 'futurex-applications.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleLogout() {
    localStorage.removeItem('futurex_admin_token')
    navigate('/admin')
  }

  return (
    <main className="admin-shell">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <h1>Applications</h1>
          <div className="dashboard-actions">
            <button type="button" onClick={handleDownload}>
              Download Data
            </button>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {message ? <p className="status-message">{message}</p> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Country</th>
                <th>State</th>
                <th>District</th>
                <th>Department</th>
                <th>Level</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.name}</td>
                  <td>{entry.email}</td>
                  <td>{entry.countryCode}{entry.mobile}</td>
                  <td>{entry.country}</td>
                  <td>{entry.state}</td>
                  <td>{entry.district}</td>
                  <td>{entry.department}</td>
                  <td>{entry.level}</td>
                  <td>{entry.course}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage
