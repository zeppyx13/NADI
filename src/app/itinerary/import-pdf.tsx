import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { FileText, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { SimulationBadge } from '@/components/status/simulation-badge';
import {
  AppButton,
  AppCard,
  AppText,
  ErrorState,
  LoadingState,
  ScreenContainer,
} from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import {
  LocalItineraryImportService,
  type ItineraryImportService,
} from '@/services/itinerary-import-service';
import type { ImportedFile, StructuredItineraryDraft } from '@/types/itinerary';

const importService: ItineraryImportService = new LocalItineraryImportService();

type ScreenState = 'idle' | 'processing' | 'error';

export default function ImportPdfScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { createFromDraft } = useItineraries();
  const [state, setState] = useState<ScreenState>('idle');
  const [selectedFile, setSelectedFile] = useState<ImportedFile | null>(null);
  const [errorKey, setErrorKey] = useState<string>('ingestionErrors.pdfInvalid');

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const file: ImportedFile = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
        size: asset.size ?? undefined,
      };
      setSelectedFile(file);
      await processPdf(file);
    } catch {
      setState('error');
      setErrorKey('ingestionErrors.pdfInvalid');
    }
  };

  const processPdf = async (file: ImportedFile) => {
    setState('processing');
    try {
      const result = await importService.importPdf(file);
      if (!result.success || !result.draft) {
        setState('error');
        setErrorKey(result.errorKey ?? 'ingestionErrors.pdfInvalid');
        return;
      }
      await saveAndNavigate(result.draft);
    } catch {
      setState('error');
      setErrorKey('ingestionErrors.pdfInvalid');
    }
  };

  const saveAndNavigate = async (draft: StructuredItineraryDraft) => {
    try {
      const itinerary = await createFromDraft(draft);
      router.replace({
        pathname: '/itinerary/[id]',
        params: { id: itinerary.id },
      });
    } catch {
      setState('error');
      setErrorKey('ingestionErrors.pdfInvalid');
    }
  };

  if (state === 'processing') {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState
          title={t('ingestion.pdfProcessing')}
          description={t('ingestion.simulationIngestionLabel')}
        />
      </ScreenContainer>
    );
  }

  if (state === 'error') {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          title={t(errorKey).split('\n')[0]}
          description={t(errorKey).split('\n')[1] ?? ''}
          onRetry={() => {
            setState('idle');
            setSelectedFile(null);
          }}
          retryLabel={t('common.retry')}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <ItineraryScreenHeader
        title={t('ingestion.uploadPdf')}
        subtitle={t('ingestion.alreadyHavePlanDescription')}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />
      <SimulationBadge label={t('ingestion.simulationIngestionLabel')} />

      <AppCard variant="elevated" style={styles.uploadCard}>
        <View style={styles.iconContainer}>
          <Upload size={iconSizes.empty} color={colors.brand[600]} />
        </View>
        <AppText variant="headingMd" style={styles.centered}>
          {t('ingestion.choosePdf')}
        </AppText>
        <AppText
          variant="bodyMd"
          color={colors.neutral.textSecondary}
          style={styles.centered}
        >
          {t('ingestion.uploadPdfDescription')}
        </AppText>

        {selectedFile && (
          <View style={styles.fileInfo}>
            <FileText size={iconSizes.button} color={colors.brand[700]} />
            <AppText variant="labelLg" style={styles.fileName}>
              {selectedFile.name}
            </AppText>
          </View>
        )}

        <AppButton
          fullWidth
          label={t('ingestion.choosePdf')}
          onPress={() => void pickPdf()}
        />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  uploadCard: {
    gap: spacing[4],
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,
    backgroundColor: colors.brand[50],
  },
  centered: {
    textAlign: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.neutral.surfaceSoft,
  },
  fileName: {
    flex: 1,
  },
});
