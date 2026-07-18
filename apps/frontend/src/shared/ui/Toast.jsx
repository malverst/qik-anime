import { useAuth } from '@fsd/app/providers/AuthContext.jsx'

export default function Toast() {
  const { toast } = useAuth()
  if (!toast) return null
  return <div className="toast">{toast}</div>
}
