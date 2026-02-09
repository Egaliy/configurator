/** Роли по ТЗ: администратор, дизайнер, заказчик */
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

/** Может добавлять и редактировать комментарии */
export function canComment(_role: Role): boolean {
  return true
}

/** Может создавать/редактировать этапы и события на таймлайне */
export function canEditStages(role: Role): boolean {
  return role === 'admin'
}

/** Может управлять проектом (настройки, участники, удаление) */
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
