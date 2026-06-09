const ROLE_LABELS = {
  Owner: 'Владелец',
  'Project Lead': 'Руководитель проекта',
  'Team Lead': 'Руководитель команды',
  Developer: 'Разработчик',
  Artist: 'Художник',
  Maintainer: 'Поддержка',
  Member: 'Участник',
  Contributor: 'Участник',
}

const ROLE_ORDER = {
  'Team Lead': 0,
  'Project Lead': 0,
  Owner: 1,
  Developer: 2,
  Maintainer: 3,
  Artist: 4,
  Member: 5,
  Contributor: 6,
}

export class TeamMemberPresenter {
  constructor(members = []) {
    this.members = Array.isArray(members) ? members : []
  }

  sorted() {
    return [...this.members].sort((a, b) => {
      const ownerDiff = Number(Boolean(b.is_owner)) - Number(Boolean(a.is_owner))
      if (ownerDiff !== 0) return ownerDiff
      const roleDiff =
        (ROLE_ORDER[a.role] ?? Number.MAX_SAFE_INTEGER) -
        (ROLE_ORDER[b.role] ?? Number.MAX_SAFE_INTEGER)
      if (roleDiff !== 0) return roleDiff
      return (a.ordering ?? 0) - (b.ordering ?? 0)
    })
  }

  static isPrimaryOwner(member) {
    return member?.is_owner === true
  }

  static roleLabel(role) {
    return ROLE_LABELS[role] || role
  }
}
