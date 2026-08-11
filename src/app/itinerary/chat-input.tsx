import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { SimulationBadge } from '@/components/status/simulation-badge';
import {
  AppButton,
  AppCard,
  AppText,
  LoadingState,
  ScreenContainer,
} from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import {
  LocalItineraryChatService,
  type ItineraryChatService,
} from '@/services/itinerary-import-service';
import type {
  ItineraryChatMessage,
  StructuredItineraryDraft,
} from '@/types/itinerary';
import { createItineraryId } from '@/utils/itinerary';

const chatService: ItineraryChatService = new LocalItineraryChatService();
const SESSION_ID = 'ingestion-chat-session';

type ScreenState = 'chatting' | 'building' | 'error';

export default function ChatInputScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { createFromDraft } = useItineraries();
  const [messages, setMessages] = useState<ItineraryChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [state, setState] = useState<ScreenState>('chatting');
  const [isSending, setIsSending] = useState(false);
  const [isDraftReady, setIsDraftReady] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const userMessage: ItineraryChatMessage = {
      id: createItineraryId('msg'),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const response = await chatService.sendMessage(SESSION_ID, text);
      setMessages((prev) => [...prev, response.message]);
      if (response.isDraftReady) {
        setIsDraftReady(true);
      }
    } catch {
      setState('error');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending]);

  const buildDraft = useCallback(async () => {
    setState('building');
    try {
      const draft: StructuredItineraryDraft =
        await chatService.buildDraft(SESSION_ID);
      const itinerary = await createFromDraft(draft);
      router.replace({
        pathname: '/itinerary/[id]',
        params: { id: itinerary.id },
      });
    } catch {
      setState('error');
    }
  }, [createFromDraft, router]);

  const renderMessage = useCallback(
    ({ item }: { item: ItineraryChatMessage }) => (
      <View
        style={[
          styles.messageBubble,
          item.role === 'user'
            ? styles.userBubble
            : styles.assistantBubble,
        ]}
      >
        <AppText
          variant="bodyMd"
          color={
            item.role === 'user'
              ? colors.neutral.white
              : colors.neutral.textPrimary
          }
        >
          {item.content}
        </AppText>
      </View>
    ),
    [],
  );

  if (state === 'building') {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState
          title={t('ingestion.chatProcessing')}
          description={t('ingestion.simulationIngestionLabel')}
        />
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScreenContainer
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.screen}
      >
        <ItineraryScreenHeader
          title={t('ingestion.tellNadi')}
          subtitle={t('ingestion.tellNadiDescription')}
          backLabel={t('common.back')}
          onBack={() => router.back()}
        />
        <SimulationBadge label={t('ingestion.simulationIngestionLabel')} />

        {messages.length === 0 && (
          <AppCard variant="soft" style={styles.hintCard}>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('ingestion.chatHint')}
            </AppText>
          </AppCard>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          style={styles.flex}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {isSending && (
          <View style={styles.typingIndicator}>
            <AppText variant="caption" color={colors.neutral.textMuted}>
              NADI...
            </AppText>
          </View>
        )}

        {isDraftReady && (
          <AppButton
            fullWidth
            variant="teal"
            label={t('ingestion.buildDraft')}
            onPress={() => void buildDraft()}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('ingestion.chatPlaceholder')}
            placeholderTextColor={colors.neutral.textMuted}
            multiline
            maxLength={1000}
            onSubmitEditing={() => void sendMessage()}
            blurOnSubmit={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('ingestion.tellNadi')}
            disabled={!inputText.trim() || isSending}
            onPress={() => void sendMessage()}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.pressed,
              (!inputText.trim() || isSending) && styles.sendDisabled,
            ]}
          >
            <Send size={iconSizes.button} color={colors.neutral.white} />
          </Pressable>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[3],
    flex: 1,
  },
  hintCard: {
    marginBottom: spacing[2],
  },
  messageList: {
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[600],
    borderBottomRightRadius: radii.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral.surfaceMuted,
    borderBottomLeftRadius: radii.xs,
  },
  typingIndicator: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.neutral.borderSoft,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.neutral.surfaceSoft,
    color: colors.neutral.textPrimary,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[600],
  },
  sendDisabled: {
    backgroundColor: colors.semantic.disabled.main,
  },
  pressed: {
    opacity: 0.72,
  },
});
