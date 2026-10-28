import { useEffect, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useDebounced } from '../../hooks/useAsync'

interface Props<T> {
  label: string
  value: T | null
  onChange: (v: T | null) => void
  /** Server-side search: called (debounced) with the typed text. */
  fetchOptions: (query: string) => Promise<T[]>
  getLabel: (v: T) => string
  getKey: (v: T) => number
  disabled?: boolean
  required?: boolean
  error?: string | null
}

/** Searchable dropdown backed by a server-side search (used for Company and User pickers). */
export default function RemoteAutocomplete<T>({ label, value, onChange, fetchOptions, getLabel, getKey, disabled, required, error }: Props<T>) {
  const [input, setInput] = useState('')
  const q = useDebounced(input, 250)
  const [options, setOptions] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let live = true
    setLoading(true)
    fetchOptions(q).then((o) => { if (live) setOptions(o) }).catch(() => { if (live) setOptions([]) }).finally(() => { if (live) setLoading(false) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  return (
    <Autocomplete
      options={options} value={value} disabled={disabled} loading={loading}
      getOptionLabel={getLabel} isOptionEqualToValue={(a, b) => getKey(a) === getKey(b)}
      filterOptions={(o) => o /* filtering is done by the server */}
      onChange={(_, v) => onChange(v)} onInputChange={(_, v, reason) => { if (reason !== 'reset') setInput(v) }}
      renderInput={(params) => (
        <TextField {...params} label={label} required={required} margin="dense" error={!!error} helperText={error ?? undefined}
          slotProps={{ input: { ...params.InputProps, endAdornment: <>{loading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</> } }} />
      )}
    />
  )
}
