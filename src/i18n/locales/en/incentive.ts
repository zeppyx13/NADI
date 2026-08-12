export const incentiveEn = {
  title: 'Activity & Points',
  subtitle: 'Your journeys and how they help spread visits more evenly.',
  level: {
    label: 'Level',
    '1': 'New Explorer',
    '2': 'Local Explorer',
    '3': 'Balanced Explorer',
    '4': 'Distribution Mover',
    '5': 'Balanced Tourism Ambassador',
  },
  xp: 'XP',
  xpProgress: '{{current}} / {{target}} XP',
  xpMax: 'Highest level reached',
  points: 'NADI Points',
  pointsBalance: '{{count}} NADI Points',
  impactTitle: 'The impact of your journeys',
  impactNote: 'Your activity supports a more balanced spread of visits.',
  impactEmpty:
    'No verified activity yet. Verified visits will appear here.',
  impact: {
    alternativeVisits: '{{count}} alternative destinations visited',
    offPeakVisits: '{{count}} visits at a recommended time',
    localBusinessVisits: '{{count}} local businesses supported',
    distributionActions: '{{count}} actions supporting distribution',
    completedCampaigns: '{{count}} incentive programmes completed',
  },
  campaignsTitle: 'Active incentive programmes',
  campaignsEmpty: 'No incentive programme is running right now.',
  campaignReward: 'Bonus {{multiplier}}× XP · +{{points}} Points',
  campaignObjective: {
    'redistribute-visits': 'Spreading visits',
    'off-peak-visit': 'Off-peak visiting',
    'support-local-business': 'Supporting local business',
    'alternative-destination': 'Alternative destination',
  },
  campaigns: {
    lovinaAlternative: {
      title: 'Explore Lovina',
      description:
        'Visiting Lovina helps draw traffic away from the crowded south.',
    },
    tanahLotOffPeak: {
      title: 'Tanah Lot in the morning',
      description:
        'Arriving in the morning eases the build-up before sunset.',
    },
    besakihRedistribute: {
      title: 'Besakih and around',
      description:
        'Visiting the east helps balance how travellers are spread out.',
    },
    warungLovinaLocal: {
      title: 'Support Lovina businesses',
      description:
        'Checking in at a partner widens the economic benefit for local businesses.',
    },
    tenunBesakihLocal: {
      title: 'Support Karangasem weavers',
      description:
        'Checking in at a partner widens the economic benefit for local businesses.',
    },
    kutaExpired: {
      title: 'Kuta programme',
      description: 'This programme has ended.',
    },
  },
  rewardsTitle: 'Reward wallet',
  rewardsEmpty:
    'No rewards yet. Earn Points from verified activity.',
  rewardStatus: {
    available: 'Available',
    claimed: 'Ready to use',
    redeemed: 'Used',
    expired: 'Expired',
  },
  rewardCost: '{{count}} Points',
  rewardFree: 'No Points needed',
  rewardValidUntil: 'Valid until {{date}}',
  rewardCode: 'Code {{code}}',
  rewardClaim: 'Exchange for Points',
  rewardUse: 'Use now',
  rewardUsed: 'This reward has been used.',
  rewardInsufficient: 'You do not have enough Points for this reward.',
  rewardExpired: 'This reward has expired.',
  rewards: {
    parkingVoucher: {
      title: 'Parking voucher',
      description: 'A parking discount at partner destination areas.',
    },
    partnerDiscount: {
      title: 'Partner discount',
      description: 'A discount at a NADI partner business.',
    },
    localPerk: {
      title: 'Local perk',
      description: 'An extra benefit from a partner artisan.',
    },
    bonusPoints: {
      title: 'Bonus Points',
      description: 'Extra NADI Points for your next journey.',
    },
  },
  walletTitle: 'My vouchers',
  walletSubtitle: 'Rewards you hold · {{count}} NADI Points',
  walletTabActive: 'Usable',
  walletTabUsed: 'History',
  walletEmptyActive:
    'No usable voucher yet. Exchange Points or reach a new level to earn one.',
  walletEmptyUsed: 'No voucher has been used or expired yet.',
  walletEntry: 'My vouchers',
  walletEntrySubtitle: 'The rewards you have earned.',
  achievementsTitle: 'Achievements',
  achievementProgress: '{{current}} / {{target}}',
  achievements: {
    balancedExplorer: {
      title: 'Balanced Explorer',
      description: 'Visit the alternative destinations NADI recommends.',
    },
    offPeak: {
      title: 'Off-Peak Traveller',
      description: 'Visit at quieter times.',
    },
    localSupporter: {
      title: 'Local Supporter',
      description: 'Check in at NADI partner businesses.',
    },
    adaptiveTraveller: {
      title: 'Adaptive Traveller',
      description: 'Accept NADI suggestions that balance your journey.',
    },
  },
  partnersTitle: 'Partner businesses',
  partners: {
    warungLovina: { perk: 'A free local drink for NADI visitors.' },
    tenunBesakih: { perk: 'A short weaving demonstration for NADI visitors.' },
    pemanduTanahLot: { perk: 'A short tour of the Tanah Lot surroundings.' },
    pasarUbud: { perk: 'A craft discount for NADI visitors.' },
  },
  historyTitle: 'Recent activity',
  historyEmpty: 'No activity recorded yet.',
  historyReason: {
    'base-activity': 'Verified activity',
    'campaign-bonus': 'Incentive programme bonus',
    'level-milestone': 'Level milestone reward',
    'surprise-reward': 'Surprise bonus',
    'reward-redemption': 'Reward exchange',
  },
  historyAward: '+{{xp}} XP · +{{points}} Points',
  scanTitle: 'Scan check-in code',
  scanInstruction: 'Point the camera at the QR code at a destination or partner.',
  scanAction: 'Scan code',
  scanPermissionTitle: 'Camera permission needed',
  scanPermissionDescription:
    'NADI uses the camera only to scan check-in codes. Other rewards remain usable without it.',
  scanPermissionAction: 'Allow camera',
  scanPermissionSettings: 'Open settings',
  scanPermissionBlocked:
    'Camera access is turned off. Enable it in app settings to scan check-in codes.',
  scanInvalid: 'This code is not recognised.',
  scanDuplicate: 'This check-in has already been recorded.',
  scanNotEligible: 'No incentive applies to this check-in yet.',
  scanSuccess: 'Check-in recorded. +{{xp}} XP · +{{points}} Points',
  scanAgain: 'Scan again',
  scanClose: 'Close scanner',
  levelUpTitle: 'Reached Level {{level}}',
  levelUpDescription: 'The milestone reward has been added to your wallet.',
  homeAction: 'View activity & rewards',
  openActivity: 'Open activity and points',
  profileEntry: 'Activity & Points',
  profileEntrySubtitle: 'Your level, NADI Points, and journey impact.',
  demoTitle: 'Test activity',
  demoDescription:
    'Record a verified activity to exercise the incentive flow. Available on development builds.',
  demoVisitAlternative: 'Lovina visit',
  demoOffPeakVisit: 'Tanah Lot morning visit',
  demoPartnerCheckIn: 'Partner check-in',
  demoAcceptRecommendation: 'Accept suggestion',
} as const;
