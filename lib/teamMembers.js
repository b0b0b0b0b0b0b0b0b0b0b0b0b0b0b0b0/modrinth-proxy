const ROLE_LABELS = {
  Owner: 'Владелец',
  Developer: 'Разработчик',
  Artist: 'Художник',
  Maintainer: 'Поддержка',
  Contributor: 'Участник',
}

export class TeamMemberPresenter {
  constructor(members = []) {
    this.members = Array.isArray(members) ? members : []
  }

  sorted() {
    return [...this.members].sort((a, b) => {
      const ownerDiff = Number(Boolean(b.is_owner)) - Number(Boolean(a.is_owner))
      if (ownerDiff !== 0) return ownerDiff
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
