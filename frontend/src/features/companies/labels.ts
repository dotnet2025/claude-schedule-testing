import type { Company, User } from '../../types'

export const companyLabel = (c: Pick<Company, 'companyCode' | 'companyName'>) => `${c.companyName} (${c.companyCode})`
export const userLabel = (u: User) => `${u.displayName} — ${u.email}`
