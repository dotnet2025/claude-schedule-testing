import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import WarningAmber from '@mui/icons-material/WarningAmber'

interface Props { open: boolean; title: string; message: string; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="confirm-title" fullWidth maxWidth="xs">
      <Box sx={{ display: 'flex', gap: 2, p: 3, pb: 0 }}>
        <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText', width: 44, height: 44, opacity: 0.9 }} aria-hidden><WarningAmber /></Avatar>
        <Box sx={{ minWidth: 0 }}>
          <DialogTitle id="confirm-title" sx={{ p: 0, pb: 1 }}>{title}</DialogTitle>
          <DialogContent sx={{ p: 0 }}><DialogContentText sx={{ overflowWrap: 'anywhere' }}>{message}</DialogContentText></DialogContent>
        </Box>
      </Box>
      <DialogActions sx={{ pt: 3 }}>
        <Button onClick={onCancel} disabled={busy} color="inherit">Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}
