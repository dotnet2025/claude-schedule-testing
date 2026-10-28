import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from '@mui/material'
import { companiesApi } from '../../api/endpoints'
import { useAsync } from '../../hooks/useAsync'
import { ErrorView, Loading } from '../../components/StateViews'
import CompanyUsersTab from './CompanyUsersTab'

/** Company Details: General Information and Users tabs. */
export default function CompanyDetailsPage() {
  const { id } = useParams()
  const companyId = Number(id)
  const [tab, setTab] = useState(0)
  const { data: company, error, loading, reload } = useAsync(() => companiesApi.get(companyId), [companyId])
  if (loading && !company) return <Loading />
  if (error || !company) return <ErrorView message={error ?? 'Company not found.'} />
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography component="h1" variant="h4">{company.companyName}</Typography>
        <Chip label={company.isActive ? 'Active' : 'Inactive'} color={company.isActive ? 'success' : 'default'} />
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Company sections" variant="scrollable">
        <Tab label="General Information" id="company-tab-0" aria-controls="company-panel-0" />
        <Tab label={`Users (${company.activeUserCount})`} id="company-tab-1" aria-controls="company-panel-1" />
      </Tabs>
      {tab === 0 && (
        <Paper sx={{ p: 2 }} role="tabpanel" id="company-panel-0" aria-labelledby="company-tab-0">
          <Stack spacing={1}>
            {([['Company code', company.companyCode], ['Company name', company.companyName], ['Status', company.isActive ? 'Active' : 'Inactive'],
              ['Created', new Date(company.createdAt).toLocaleString()], ['Last updated', new Date(company.updatedAt).toLocaleString()]] as const).map(([k, v]) => (
              <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography>{v}</Typography></Box>
            ))}
          </Stack>
        </Paper>
      )}
      {tab === 1 && <Box role="tabpanel" id="company-panel-1" aria-labelledby="company-tab-1"><CompanyUsersTab company={company} onChanged={reload} /></Box>}
    </Stack>
  )
}
