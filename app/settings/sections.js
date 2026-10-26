export const SETTINGS_GROUPS = [
  {
    id: 'display',
    labelKey: 'sn.display',
    items: [
      {
        href: '/settings',
        labelKey: 'sn.appearance',
        icon: [
          'M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3',
          'M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7M14.5 17.5 4.5 15',
        ],
      },
      {
        href: '/settings/language',
        labelKey: 'sn.language',
        icon: ['m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6'],
      },
    ],
  },
  {
    id: 'account',
    labelKey: 'sn.account',
    auth: true,
    items: [
      {
        href: '/settings/profile',
        labelKey: 'sn.profile',
        icon: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
      },
      {
        href: '/settings/notifications',
        labelKey: 'sn.notifications',
        icon: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0'],
      },
      {
        href: '/settings/extras',
        labelKey: 'sn.extras',
        icon: [
          'M12 3l1.9 5.8 5.8 1.9-5.8 1.9L12 18.4l-1.9-5.8-5.8-1.9 5.8-1.9Z',
          'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z',
        ],
      },
      {
        href: '/settings/data',
        labelKey: 'sn.data',
        icon: ['M12 8v4l3 2M3.05 11a9 9 0 1 1 .5 4M3 4v5h5'],
      },
      {
        href: '/settings/security',
        labelKey: 'sn.security',
        icon: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10'],
      },
    ],
  },
]

export const SIGN_IN_ICON = ['M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3']
