import type { Company } from '../../types'
import CompanyUserList from './CompanyUserList'

/** "Users" tab of Company Details: the shared Company Users list scoped to one company. */
export default function CompanyUsersTab({ company, onChanged }: { company: Company; onChanged?: () => void }) {
  return <CompanyUserList fixedCompany={company} onChanged={onChanged} />
}
