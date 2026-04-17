// tracking.service.js  ?? DEV 3 | Llamadas Axios a /api/bitacoras, /api/trackings y /api/hours
import axios from 'axios'
const API = import.meta.env.VITE_API_URL

export const trackingService = {
  getBitacoras:  ()     => axios.get(${API}/bitacoras),
  createBitacora:(data) => axios.post(${API}/bitacoras, data),
  getTrackings:  ()     => axios.get(${API}/trackings),
  createTracking:(data) => axios.post(${API}/trackings, data),
  getHours:      (id)   => axios.get(${API}/hours/),
}
