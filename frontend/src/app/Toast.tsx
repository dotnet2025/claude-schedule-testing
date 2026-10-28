import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Alert, Snackbar } from '@mui/material'

type Severity = 'success' | 'error' | 'info'
const Ctx = createContext<(msg: string, severity?: Severity) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; severity: Severity } | null>(null)
  const notify = useCallback((msg: string, severity: Severity = 'success') => setT({ msg, severity }), [])
  const value = useMemo(() => notify, [notify])
  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar open={!!t} autoHideDuration={t?.severity === 'error' ? 7000 : 4000} onClose={(_, reason) => { if (reason !== 'clickaway') setT(null) }} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {t ? <Alert severity={t.severity} variant="filled" onClose={() => setT(null)} role="status" sx={{ boxShadow: 3, alignItems: 'center', minWidth: { sm: 320 } }}>{t.msg}</Alert> : undefined}
      </Snackbar>
    </Ctx.Provider>
  )
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx)
