import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';
import { destinations } from '@/data/destinations';
import { partnerBusinesses } from '@/data/partner-businesses';
import type { ActivityEvent } from '@/types/incentive';
import { parseNadiCheckInCode } from '@/utils/nadi-qr';

type ScanOutcome =
  | { status: 'scanning' }
  | { status: 'invalid' }
  | { status: 'duplicate' }
  | { status: 'not-eligible' }
  | { status: 'awarded'; xp: number; points: number };

/**
 * QR check-in. The camera is only ever used to read a NADI code; no image is
 * kept, and only the parsed target and timestamp reach the ledger.
 */
export default function ScanScreen() {
  const { t } = useTranslation('incentive');
  const router = useRouter();
  const { recordActivity } = useIncentive();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRequesting, setIsRequesting] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome>({ status: 'scanning' });
  /** Guards against the camera firing the same frame twice. */
  const isHandlingRef = useRef(false);

  const resolveName = (targetType: string, targetId: string): string => {
    if (targetType === 'partner') {
      return (
        partnerBusinesses.find((item) => item.id === targetId)?.name ?? targetId
      );
    }
    return destinations.find((item) => item.id === targetId)?.name ?? targetId;
  };

  const handleScan = useCallback(
    async (raw: string) => {
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      const parsed = parseNadiCheckInCode(raw);
      if (parsed.status === 'invalid') {
        setOutcome({ status: 'invalid' });
        return;
      }

      const { payload } = parsed;
      const event: ActivityEvent = {
        // The code id is the idempotency key: rescanning awards nothing.
        id: `checkin-${payload.codeId}`,
        type:
          payload.targetType === 'partner' ? 'partner-visit' : 'destination-visit',
        targetType: payload.targetType,
        targetId: payload.targetId,
        targetName: resolveName(payload.targetType, payload.targetId),
        verification: 'qr-check-in',
        occurredAt: new Date().toISOString(),
        campaignId: payload.campaignId,
      };

      const result = await recordActivity(event);
      if (result.status === 'awarded') {
        setOutcome({
          status: 'awarded',
          xp: result.breakdown.finalXp,
          points: result.breakdown.finalPoints,
        });
        return;
      }
      setOutcome({
        status: result.status === 'duplicate' ? 'duplicate' : 'not-eligible',
      });
    },
    [recordActivity],
  );

  /**
   * Once the system dialog has been refused it never appears again, so the
   * button has to hand the traveller over to Settings instead of silently
   * doing nothing.
   */
  const canAskAgain = permission?.canAskAgain !== false;

  const handlePermission = async () => {
    if (isRequesting) return;
    if (!canAskAgain) {
      await Linking.openSettings().catch(() => undefined);
      return;
    }
    setIsRequesting(true);
    try {
      const next = await requestPermission();
      // A refusal that closes the door still needs to lead somewhere.
      if (!next.granted && !next.canAskAgain && Platform.OS !== 'web') {
        await Linking.openSettings().catch(() => undefined);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const scanAgain = () => {
    isHandlingRef.current = false;
    setOutcome({ status: 'scanning' });
  };

  const message =
    outcome.status === 'invalid'
      ? t('scanInvalid')
      : outcome.status === 'duplicate'
        ? t('scanDuplicate')
        : outcome.status === 'not-eligible'
          ? t('scanNotEligible')
          : outcome.status === 'awarded'
            ? t('scanSuccess', { xp: outcome.xp, points: outcome.points })
            : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="headingSm" color={colors.neutral.white}>
            {t('scanTitle')}
          </AppText>
          <AppText variant="caption" color={colors.neutral.borderStrong}>
            {t('scanInstruction')}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel={t('scanClose')}
          icon={<X size={iconSizes.button} color={colors.neutral.white} />}
          onPress={() => router.back()}
        />
      </View>

      <View style={styles.stage}>
        {!permission?.granted ? (
          <AppCard variant="elevated" style={styles.permissionCard}>
            <AppText variant="labelLg">{t('scanPermissionTitle')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {canAskAgain
                ? t('scanPermissionDescription')
                : t('scanPermissionBlocked')}
            </AppText>
            <AppButton
              fullWidth
              size="sm"
              disabled={isRequesting}
              label={
                canAskAgain ? t('scanPermissionAction') : t('scanPermissionSettings')
              }
              accessibilityLabel={
                canAskAgain ? t('scanPermissionAction') : t('scanPermissionSettings')
              }
              onPress={() => void handlePermission()}
            />
          </AppCard>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={
              outcome.status === 'scanning'
                ? (event) => void handleScan(event.data)
                : undefined
            }
            accessibilityLabel={t('scanTitle')}
          />
        )}
      </View>

      {message && (
        <View style={styles.footer}>
          <AppCard variant="elevated" style={styles.resultCard}>
            <AppText variant="labelLg">{message}</AppText>
            {outcome.status !== 'awarded' && (
              <AppButton
                fullWidth
                size="sm"
                variant="secondary"
                label={t('scanAgain')}
                onPress={scanAgain}
              />
            )}
          </AppCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: layout.screenPadding,
    overflow: 'hidden',
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.navy,
  },
  permissionCard: {
    gap: spacing[3],
    margin: spacing[4],
    padding: spacing[4],
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[4],
  },
  resultCard: {
    gap: spacing[3],
    padding: spacing[4],
  },
});
