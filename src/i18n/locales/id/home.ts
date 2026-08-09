export const homeId = {
  greeting: 'Halo, {{name}}',
  notifications: 'Buka peringatan',
  notificationsWithCount: 'Buka peringatan, {{count}} belum dibaca',
  searchPlaceholder: 'Cari destinasi, area, atau tempat di Bali',
  searchAccessibility: 'Buka pencarian destinasi di Jelajah',
  simulationLabel: 'Data Simulasi',
  partialNotice: 'Sebagian ringkasan belum tersedia. Informasi lain tetap dapat digunakan.',

  travelConditions: {
    title: 'Kondisi perjalanan',
    subtitle: 'Ringkasan area di sekitar Anda',
    openMap: 'Buka peta',
    smoothTitle: 'Kondisi sekitar cukup lancar',
    moderateTitle: 'Beberapa area mulai ramai',
    attentionTitle: 'Beberapa area perlu perhatian',
    summary:
      '{{crowdedCount}} area mengalami kepadatan dan {{incidentCount}} gangguan perjalanan terdeteksi.',
    crowdedAreas: 'Area padat',
    incidents: 'Gangguan',
    nearbyDestinations: 'Destinasi',
    updatedAt: 'Diperbarui pukul {{time}}',
    mapAccessibility:
      'Pratinjau peta kondisi sekitar. Tekan untuk membuka tab Peta.',
    userMarker: 'Posisi Anda',
    destinationMarker: 'Destinasi rekomendasi',
    crowdedMarker: 'Area padat',
    incidentMarker: 'Lokasi gangguan',
  },

  importantAlert: {
    title: 'Perlu perhatian',
    alternativeRoute: 'Lihat rute alternatif',
    viewOnMap: 'Lihat di peta',
    distanceAway: '{{distance}} km dari Anda',
  },

  activeJourney: {
    title: 'Perjalanan aktif',
    headingTo: 'Menuju {{destination}}',
    metadata: '{{minutes}} menit ke stop berikutnya · {{count}} tujuan',
    continue: 'Lanjutkan perjalanan',
    smooth: 'Kondisi perjalanan lancar',
    moderate: 'Perjalanan mengalami sedikit kepadatan',
    disrupted: 'Perjalanan terdampak gangguan',
  },

  plannedJourney: {
    title: 'Rencana perjalanan hari ini',
    metadata: '{{date}} · {{count}} tujuan',
    description: 'Rencana sudah disetujui dan siap dimulai.',
    open: 'Lihat rencana',
  },

  planJourney: {
    title: 'Rencanakan perjalanan Anda',
    description:
      'Pilih destinasi dan temukan rute yang sesuai dengan kondisi perjalanan.',
    action: 'Mulai merencanakan',
    openAll: 'Lihat semua rencana perjalanan',
  },

  recommendations: {
    title: 'Rekomendasi untuk Anda',
    subtitle:
      'Pilihan destinasi dengan akses dan kepadatan yang lebih seimbang.',
    seeAll: 'Lihat semua',
    predictedAtArrival: 'Prediksi saat tiba',
    reasons: {
      lowerArrivalOccupancy: 'Diperkirakan lebih lengang saat Anda tiba.',
      smootherAccess: 'Akses lebih lancar dari lokasi Anda.',
      culturalPreference: 'Sesuai preferensi wisata budaya Anda.',
      lowerRouteRisk: 'Rute menuju lokasi memiliki risiko lebih rendah.',
      parkingAvailable: 'Parkir diperkirakan tersedia saat Anda tiba.',
    },
  },

  nearby: {
    title: 'Di sekitar Anda',
    subtitle: 'Destinasi yang mudah dijangkau dari lokasi Anda.',
    distanceAway: '{{distance}} km',
    travelTime: '{{minutes}} menit',
    openDestination: 'Buka {{name}} di peta',
  },

  localContext: {
    title: 'Agenda dan kondisi lokal',
    viewAll: 'Lihat semua',
    viewAlerts: 'Lihat peringatan',
    schedule: 'Berlangsung pukul {{start}}–{{end}}',
  },

  image: {
    destinationAccessibility: 'Foto destinasi {{name}}',
    photoCredit: 'Foto oleh {{name}} di Unsplash',
    photoCreditAccessibility: 'Buka halaman fotografer {{name}} di Unsplash',
  },

  states: {
    loadingTitle: 'Menyiapkan ringkasan perjalanan',
    loadingDescription: 'Kondisi dan rekomendasi lokal sedang dirangkum.',
    emptyTitle: 'Ringkasan belum tersedia',
    emptyDescription: 'Jelajahi destinasi atau buka peta untuk mulai merencanakan.',
    emptyAction: 'Buka Jelajah',
    errorTitle: 'Ringkasan tidak dapat dimuat',
    errorDescription: 'Data lokal NADI belum dapat dibuka. Silakan coba kembali.',
    retry: 'Coba lagi',
  },
} as const;
