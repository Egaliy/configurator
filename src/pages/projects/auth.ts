/** Roles: admin, designer, client */
export type Role = 'admin' | 'designer' | 'client'

export interface User {
  id: string
  name: string
  role: Role
}

const STORAGE_KEY = 'projects-role'

export function getStoredRole(): Role | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'admin' || v === 'client') return v
    if (v === 'designer') return 'admin'
  } catch {
    // ignore
  }
  return null
}

export function setStoredRole(role: Role): void {
  try {
    localStorage.setItem(STORAGE_KEY, role)
  } catch {
    // ignore
  }
}

/** Can add and edit comments */
export function canComment(_role: Role): boolean {
  return true
}

/** Can create/edit stages and events on the timeline */
export function canEditStages(role: Role): boolean {
  return role === 'admin'
}

/** Can manage project (settings, members, delete) */
export function canManageProject(role: Role): boolean {
  return role === 'admin'
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'designer':
      return 'Administrator'
    case 'client':
      return 'Client'
    default:
      return role
  }
}
