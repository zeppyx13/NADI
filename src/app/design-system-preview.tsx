/**
 * Design System Preview — NADI
 *
 * Halaman internal untuk verifikasi visual design system.
 * Bukan route utama aplikasi. Akses via URL:
 *   exp://localhost:8081/design-system-preview
 *
 * Atau tambahkan navigasi sementara dari halaman manapun:
 *   router.push('/design-system-preview');
 */

import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  MapPin,
  Navigation,
  Bell,
  Star,
  Inbox,
} from 'lucide-react-native';

import {
  colors,
  spacing,
  radii,
  layout,
  iconSizes,
} from '@/constants/theme';

import {
  AppText,
  AppButton,
  IconButton,
  AppCard,
  AppInput,
  SearchField,
  AppBadge,
  SectionHeader,
  Divider,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/ui';

import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { SimulationBadge } from '@/components/status/simulation-badge';
import { RouteModeBadge } from '@/components/route/route-mode-badge';
import { IncidentAlert } from '@/components/incident/incident-alert';

export default function DesignSystemPreview() {
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AppText variant="displayMd" color={colors.brand[500]}>
          NADI Design System
        </AppText>
        <AppText variant="bodySm" color={colors.neutral.textSecondary}>
          Preview internal — bukan halaman produksi
        </AppText>

        <Divider />

        {/* ─── Color Palette ─── */}
        <SectionHeader title="Color Palette" subtitle="Brand, Teal, Neutral, Semantic" />

        <AppText variant="labelLg">Brand Colors</AppText>
        <View style={styles.colorRow}>
          {Object.entries(colors.brand).map(([key, hex]) => (
            <View key={key} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}</AppText>
            </View>
          ))}
        </View>

        <AppText variant="labelLg">Teal Colors</AppText>
        <View style={styles.colorRow}>
          {Object.entries(colors.teal).map(([key, hex]) => (
            <View key={key} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}</AppText>
            </View>
          ))}
        </View>

        <AppText variant="labelLg">Semantic Colors</AppText>
        <View style={styles.colorRow}>
          {Object.entries(colors.semantic).map(([key, value]) => (
            <View key={key} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: value.main }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}</AppText>
            </View>
          ))}
        </View>

        <AppText variant="labelLg">Occupancy Colors</AppText>
        <View style={styles.colorRow}>
          {Object.entries(colors.occupancy).map(([key, hex]) => (
            <View key={key} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}</AppText>
            </View>
          ))}
        </View>

        <AppText variant="labelLg">Route Colors</AppText>
        <View style={styles.colorRow}>
          {Object.entries(colors.route).map(([key, hex]) => (
            <View key={key} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}</AppText>
            </View>
          ))}
        </View>

        <Divider />

        {/* ─── Typography ─── */}
        <SectionHeader title="Typography" subtitle="Inter font family" />

        <AppText variant="displayLg">Display Large</AppText>
        <AppText variant="displayMd">Display Medium</AppText>
        <AppText variant="headingLg">Heading Large</AppText>
        <AppText variant="headingMd">Heading Medium</AppText>
        <AppText variant="headingSm">Heading Small</AppText>
        <AppText variant="bodyLg">Body Large — teks isi penting</AppText>
        <AppText variant="bodyMd">Body Medium — teks default</AppText>
        <AppText variant="bodySm">Body Small — metadata</AppText>
        <AppText variant="labelLg">Label Large — tombol</AppText>
        <AppText variant="labelMd">Label Medium — chip & badge</AppText>
        <AppText variant="caption">Caption — keterangan kecil</AppText>
        <AppText variant="micro">Micro — label sangat kecil</AppText>

        <Divider />

        {/* ─── Buttons ─── */}
        <SectionHeader title="Buttons" subtitle="Primary, Secondary, Teal, Danger, Ghost" />

        <View style={styles.gap12}>
          <AppButton label="Primary Button" variant="primary" fullWidth />
          <AppButton label="Secondary Button" variant="secondary" fullWidth />
          <AppButton label="Teal Action" variant="teal" fullWidth />
          <AppButton label="Danger" variant="danger" fullWidth />
          <AppButton label="Ghost Button" variant="ghost" fullWidth />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>States</AppText>
        <View style={styles.gap12}>
          <AppButton label="Loading..." variant="primary" loading fullWidth />
          <AppButton label="Disabled" variant="primary" disabled fullWidth />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Sizes</AppText>
        <View style={styles.row}>
          <AppButton label="Small" variant="primary" size="sm" />
          <AppButton label="Medium" variant="primary" size="md" />
          <AppButton label="Large" variant="primary" size="lg" />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>With Icons</AppText>
        <View style={styles.gap12}>
          <AppButton
            label="Mulai Navigasi"
            variant="teal"
            leadingIcon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
            fullWidth
          />
          <AppButton
            label="Lihat Peta"
            variant="secondary"
            leadingIcon={<MapPin size={iconSizes.button} color={colors.brand[700]} />}
            fullWidth
          />
        </View>

        <Divider />

        {/* ─── Icon Buttons ─── */}
        <SectionHeader title="Icon Buttons" subtitle="Default, Soft, Solid, Danger" />
        <View style={styles.row}>
          <IconButton
            accessibilityLabel="Bell"
            icon={<Bell size={iconSizes.button} color={colors.neutral.iconMuted} />}
            variant="default"
            onPress={() => {}}
          />
          <IconButton
            accessibilityLabel="Star"
            icon={<Star size={iconSizes.button} color={colors.neutral.textPrimary} />}
            variant="soft"
            onPress={() => {}}
          />
          <IconButton
            accessibilityLabel="Navigation"
            icon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
            variant="solid"
            onPress={() => {}}
          />
          <IconButton
            accessibilityLabel="Danger"
            icon={<Bell size={iconSizes.button} color={colors.semantic.danger.main} />}
            variant="danger"
            onPress={() => {}}
          />
        </View>

        <Divider />

        {/* ─── Cards ─── */}
        <SectionHeader title="Cards" subtitle="Default, Elevated, Outlined, Soft" />

        <View style={styles.gap12}>
          <AppCard variant="default">
            <AppText variant="headingSm">Default Card</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              White background, soft border, small shadow
            </AppText>
          </AppCard>

          <AppCard variant="elevated">
            <AppText variant="headingSm">Elevated Card</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              White background, medium shadow
            </AppText>
          </AppCard>

          <AppCard variant="outlined">
            <AppText variant="headingSm">Outlined Card</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              White background, strong border
            </AppText>
          </AppCard>

          <AppCard variant="soft">
            <AppText variant="headingSm">Soft Card</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              Muted surface background
            </AppText>
          </AppCard>
        </View>

        <Divider />

        {/* ─── Inputs ─── */}
        <SectionHeader title="Inputs" subtitle="Text input, search field" />

        <View style={styles.gap12}>
          <AppInput
            label="Label"
            placeholder="Masukkan teks..."
            value={inputValue}
            onChangeText={setInputValue}
          />
          <AppInput
            label="Dengan Error"
            placeholder="Input error"
            error="Kolom ini wajib diisi"
            value=""
          />
          <AppInput
            label="Dengan Helper"
            placeholder="Input helper"
            helperText="Minimal 8 karakter"
            value=""
          />
          <AppInput
            label="Disabled"
            placeholder="Tidak bisa diedit"
            editable={false}
            value=""
          />
          <SearchField
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Cari destinasi..."
          />
        </View>

        <Divider />

        {/* ─── Badges ─── */}
        <SectionHeader title="Badges" subtitle="Semantic, simulation, occupancy, route" />

        <AppText variant="labelLg">App Badges</AppText>
        <View style={styles.wrapRow}>
          <AppBadge label="Info" variant="info" />
          <AppBadge label="Success" variant="success" />
          <AppBadge label="Warning" variant="warning" />
          <AppBadge label="Danger" variant="danger" />
          <AppBadge label="Neutral" variant="neutral" />
          <AppBadge label="Simulasi" variant="simulation" />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Occupancy Badges</AppText>
        <View style={styles.wrapRow}>
          <OccupancyBadge level="low" />
          <OccupancyBadge level="moderate" />
          <OccupancyBadge level="high" />
          <OccupancyBadge level="critical" />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Occupancy Badges (Small)</AppText>
        <View style={styles.wrapRow}>
          <OccupancyBadge level="low" size="sm" />
          <OccupancyBadge level="moderate" size="sm" />
          <OccupancyBadge level="high" size="sm" />
          <OccupancyBadge level="critical" size="sm" />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Route Mode Badges</AppText>
        <View style={styles.wrapRow}>
          <RouteModeBadge mode="fastest" />
          <RouteModeBadge mode="safest" />
          <RouteModeBadge mode="balanced" />
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Simulation Badge</AppText>
        <SimulationBadge />

        <Divider />

        {/* ─── Incident Alert ─── */}
        <SectionHeader title="Incident Alert" subtitle="Peringatan insiden" />

        <IncidentAlert
          title="Titik rawan 300 m di depan"
          description="Kurangi kecepatan dan ikuti rute aman."
          severity="high"
          distance="300 m"
          action={{
            label: 'Lihat Rute Aman',
            onPress: () => {},
          }}
          onDismiss={() => {}}
        />

        <View style={styles.subsection}>
          <IncidentAlert
            title="Kemacetan ringan"
            description="Kemacetan di Jalan Sunset Road, estimasi keterlambatan 5 menit."
            severity="low"
            distance="1.2 km"
          />
        </View>

        <Divider />

        {/* ─── Section Header ─── */}
        <SectionHeader title="Section Header" subtitle="Contoh section header" />
        <SectionHeader
          title="Destinasi Populer"
          subtitle="Berdasarkan kunjungan"
          action={{ label: 'Lihat Semua', onPress: () => {} }}
        />

        <Divider />

        {/* ─── Feedback States ─── */}
        <SectionHeader title="Feedback States" subtitle="Loading, Empty, Error" />

        <AppCard variant="outlined">
          <LoadingState title="Memuat data..." />
        </AppCard>

        <View style={styles.subsection}>
          <AppCard variant="outlined">
            <EmptyState
              icon={<Inbox size={iconSizes.empty} color={colors.neutral.iconMuted} />}
              title="Tidak ada peringatan"
              description="Belum ada peringatan insiden untuk rute Anda."
              action={{ label: 'Muat Ulang', onPress: () => {} }}
            />
          </AppCard>
        </View>

        <View style={styles.subsection}>
          <AppCard variant="outlined">
            <ErrorState
              description="Gagal memuat data destinasi. Periksa koneksi dan coba lagi."
              onRetry={() => {}}
            />
          </AppCard>
        </View>

        <Divider />

        {/* ─── Spacing & Radius ─── */}
        <SectionHeader title="Spacing & Radius" subtitle="Design tokens" />

        <AppText variant="labelLg">Spacing</AppText>
        <View style={styles.gap8}>
          {Object.entries(spacing).map(([key, val]) => (
            <View key={key} style={styles.spacingRow}>
              <AppText variant="bodySm" color={colors.neutral.textSecondary} style={styles.spacingLabel}>
                space{key}: {val}px
              </AppText>
              <View style={[styles.spacingBar, { width: val * 4, backgroundColor: colors.brand[300] }]} />
            </View>
          ))}
        </View>

        <AppText variant="labelLg" style={styles.subsection}>Border Radius</AppText>
        <View style={styles.wrapRow}>
          {Object.entries(radii).map(([key, val]) => (
            <View key={key} style={styles.radiusItem}>
              <View style={[styles.radiusSwatch, { borderRadius: Math.min(val, 20) }]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}: {val}</AppText>
            </View>
          ))}
        </View>

        <Divider />

        {/* ─── Icon Sizes ─── */}
        <SectionHeader title="Icon Sizes" subtitle="Ukuran ikon standar" />
        <View style={styles.wrapRow}>
          {Object.entries(iconSizes).map(([key, size]) => (
            <View key={key} style={styles.iconSizeItem}>
              <MapPin size={size} color={colors.brand[500]} />
              <AppText variant="micro" color={colors.neutral.textMuted}>{key}: {size}</AppText>
            </View>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  colorItem: {
    alignItems: 'center',
    gap: 2,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  gap12: {
    gap: spacing[3],
  },
  gap8: {
    gap: spacing[2],
  },
  subsection: {
    marginTop: spacing[4],
  },
  spacingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  spacingLabel: {
    width: 100,
  },
  spacingBar: {
    height: 12,
    borderRadius: radii.xs,
  },
  radiusItem: {
    alignItems: 'center',
    gap: 2,
  },
  radiusSwatch: {
    width: 40,
    height: 40,
    backgroundColor: colors.brand[100],
    borderWidth: 1,
    borderColor: colors.brand[300],
  },
  iconSizeItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    paddingVertical: spacing[2],
  },
  bottomSpacer: {
    height: spacing[12],
  },
});
