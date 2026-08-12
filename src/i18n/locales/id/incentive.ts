export const incentiveId = {
  title: 'Aktivitas & Poin',
  subtitle: 'Perjalanan Anda dan dampaknya bagi distribusi wisata.',
  level: {
    label: 'Level',
    '1': 'Penjelajah Baru',
    '2': 'Penjelajah Lokal',
    '3': 'Penjelajah Seimbang',
    '4': 'Penggerak Distribusi',
    '5': 'Duta Wisata Seimbang',
  },
  xp: 'XP',
  xpProgress: '{{current}} / {{target}} XP',
  xpMax: 'Level tertinggi tercapai',
  points: 'NADI Points',
  pointsBalance: '{{count}} NADI Points',
  impactTitle: 'Dampak perjalanan Anda',
  impactNote: 'Aktivitas Anda mendukung distribusi kunjungan yang lebih seimbang.',
  impactEmpty:
    'Belum ada aktivitas terverifikasi. Kunjungan yang terverifikasi akan muncul di sini.',
  impact: {
    alternativeVisits: '{{count}} destinasi alternatif dikunjungi',
    offPeakVisits: '{{count}} kunjungan pada waktu yang direkomendasikan',
    localBusinessVisits: '{{count}} UMKM lokal didukung',
    distributionActions: '{{count}} tindakan mendukung distribusi',
    completedCampaigns: '{{count}} program insentif diselesaikan',
  },
  campaignsTitle: 'Program insentif aktif',
  campaignsEmpty: 'Belum ada program insentif yang berjalan.',
  campaignReward: 'Bonus {{multiplier}}× XP · +{{points}} Points',
  campaignObjective: {
    'redistribute-visits': 'Pemerataan kunjungan',
    'off-peak-visit': 'Kunjungan di luar jam padat',
    'support-local-business': 'Dukungan UMKM lokal',
    'alternative-destination': 'Destinasi alternatif',
  },
  campaigns: {
    lovinaAlternative: {
      title: 'Jelajahi Lovina',
      description:
        'Kunjungan ke Lovina membantu menyebarkan arus wisata dari kawasan selatan yang padat.',
    },
    tanahLotOffPeak: {
      title: 'Tanah Lot pagi hari',
      description:
        'Datang pada pagi hari membantu mengurangi penumpukan menjelang matahari terbenam.',
    },
    besakihRedistribute: {
      title: 'Besakih dan sekitarnya',
      description:
        'Kunjungan ke kawasan timur membantu menyeimbangkan sebaran wisatawan.',
    },
    warungLovinaLocal: {
      title: 'Dukung UMKM Lovina',
      description:
        'Check-in di UMKM mitra memperluas manfaat ekonomi bagi usaha lokal.',
    },
    tenunBesakihLocal: {
      title: 'Dukung perajin Karangasem',
      description:
        'Check-in di perajin mitra memperluas manfaat ekonomi bagi usaha lokal.',
    },
    kutaExpired: {
      title: 'Program Kuta',
      description: 'Periode program ini sudah berakhir.',
    },
  },
  rewardsTitle: 'Dompet reward',
  rewardsEmpty:
    'Belum ada reward. Kumpulkan Points dari aktivitas terverifikasi.',
  rewardStatus: {
    available: 'Tersedia',
    claimed: 'Siap digunakan',
    redeemed: 'Sudah digunakan',
    expired: 'Kedaluwarsa',
  },
  rewardCost: '{{count}} Points',
  rewardFree: 'Tanpa Points',
  rewardValidUntil: 'Berlaku sampai {{date}}',
  rewardCode: 'Kode {{code}}',
  rewardClaim: 'Tukar dengan Points',
  rewardUse: 'Gunakan sekarang',
  rewardUsed: 'Reward sudah digunakan.',
  rewardInsufficient: 'Points Anda belum cukup untuk reward ini.',
  rewardExpired: 'Reward ini sudah kedaluwarsa.',
  rewards: {
    parkingVoucher: {
      title: 'Voucher parkir',
      description: 'Potongan biaya parkir di area destinasi mitra.',
    },
    partnerDiscount: {
      title: 'Diskon mitra',
      description: 'Potongan harga di UMKM mitra NADI.',
    },
    localPerk: {
      title: 'Perk lokal',
      description: 'Keuntungan tambahan dari perajin mitra.',
    },
    bonusPoints: {
      title: 'Bonus Points',
      description: 'Tambahan NADI Points untuk perjalanan berikutnya.',
    },
  },
  walletTitle: 'Voucher saya',
  walletSubtitle: 'Reward yang Anda miliki · {{count}} NADI Points',
  walletTabActive: 'Bisa dipakai',
  walletTabUsed: 'Riwayat',
  walletEmptyActive:
    'Belum ada voucher yang bisa dipakai. Tukarkan Points atau naik level untuk mendapatkannya.',
  walletEmptyUsed: 'Belum ada voucher yang sudah digunakan atau kedaluwarsa.',
  walletEntry: 'Voucher saya',
  walletEntrySubtitle: 'Reward yang sudah Anda dapatkan.',
  achievementsTitle: 'Pencapaian',
  achievementProgress: '{{current}} / {{target}}',
  achievements: {
    balancedExplorer: {
      title: 'Jelajah Seimbang',
      description: 'Kunjungi destinasi alternatif yang direkomendasikan.',
    },
    offPeak: {
      title: 'Wisata Off-Peak',
      description: 'Berkunjung pada waktu yang lebih lengang.',
    },
    localSupporter: {
      title: 'Pendukung UMKM',
      description: 'Check-in di UMKM mitra NADI.',
    },
    adaptiveTraveller: {
      title: 'Rute Adaptif',
      description: 'Terima saran NADI untuk menyeimbangkan perjalanan.',
    },
  },
  partnersTitle: 'UMKM mitra',
  partners: {
    warungLovina: { perk: 'Minuman lokal gratis untuk pengunjung NADI.' },
    tenunBesakih: { perk: 'Demo menenun singkat untuk pengunjung NADI.' },
    pemanduTanahLot: { perk: 'Tur singkat area sekitar Tanah Lot.' },
    pasarUbud: { perk: 'Potongan harga kriya untuk pengunjung NADI.' },
  },
  historyTitle: 'Aktivitas terakhir',
  historyEmpty: 'Belum ada aktivitas tercatat.',
  historyReason: {
    'base-activity': 'Aktivitas terverifikasi',
    'campaign-bonus': 'Bonus program insentif',
    'level-milestone': 'Reward naik level',
    'surprise-reward': 'Bonus kejutan',
    'reward-redemption': 'Penukaran reward',
  },
  historyAward: '+{{xp}} XP · +{{points}} Points',
  scanTitle: 'Pindai kode check-in',
  scanInstruction: 'Arahkan kamera ke kode QR di destinasi atau UMKM mitra.',
  scanAction: 'Pindai kode',
  scanPermissionTitle: 'Izin kamera diperlukan',
  scanPermissionDescription:
    'NADI memakai kamera hanya untuk memindai kode check-in. Reward lain tetap dapat digunakan tanpa izin ini.',
  scanPermissionAction: 'Izinkan kamera',
  scanPermissionSettings: 'Buka pengaturan',
  scanPermissionBlocked:
    'Izin kamera sedang dimatikan. Aktifkan lewat pengaturan aplikasi untuk memindai kode check-in.',
  scanInvalid: 'Kode tidak dikenali.',
  scanDuplicate: 'Check-in ini sudah pernah dicatat.',
  scanNotEligible: 'Belum ada insentif yang berlaku untuk check-in ini.',
  scanSuccess: 'Check-in tercatat. +{{xp}} XP · +{{points}} Points',
  scanAgain: 'Pindai lagi',
  scanClose: 'Tutup pemindai',
  levelUpTitle: 'Naik ke Level {{level}}',
  levelUpDescription: 'Reward milestone sudah ditambahkan ke dompet Anda.',
  homeAction: 'Lihat aktivitas & reward',
  openActivity: 'Buka aktivitas dan poin',
  profileEntry: 'Aktivitas & Poin',
  profileEntrySubtitle: 'Level, NADI Points, dan dampak perjalanan Anda.',
  demoTitle: 'Aktivitas uji',
  demoDescription:
    'Catat aktivitas terverifikasi untuk menguji alur insentif. Tersedia pada build pengembangan.',
  demoVisitAlternative: 'Kunjungan Lovina',
  demoOffPeakVisit: 'Kunjungan pagi Tanah Lot',
  demoPartnerCheckIn: 'Check-in UMKM',
  demoAcceptRecommendation: 'Terima saran',
} as const;
