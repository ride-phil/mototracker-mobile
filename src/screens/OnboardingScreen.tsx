import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { getOnboardingStatus, createGpsAccount, createDevice, OnboardingStatus } from '../services/onboarding';
import HamburgerButton from '../components/HamburgerButton';

const TRACCAR_CLIENT_ANDROID = 'https://play.google.com/store/apps/details?id=org.traccar.client';
const TRACCAR_CLIENT_IOS     = 'https://apps.apple.com/app/traccar-client/id843156974';

export default function OnboardingScreen() {
  const [status, setStatus]       = useState<OnboardingStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [busy, setBusy]           = useState<string | null>(null); // which action is in progress
  const [copied, setCopied]       = useState<string | null>(null); // which field was just copied
  const pollRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await getOnboardingStatus();
      setStatus(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load setup status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Auto-poll signal when device exists but not yet communicating
  useEffect(() => {
    const shouldPoll = status?.has_device && status?.signal?.status !== 'communicating';

    if (shouldPoll) {
      pollRef.current = setInterval(() => fetchStatus(false), 10000);
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status?.has_device, status?.signal?.status]);

  async function handleCreateAccount() {
    setBusy('account');
    setError(null);
    try {
      await createGpsAccount();
      await fetchStatus(false);
    } catch (e: any) {
      setError(e.message || 'Failed to create GPS account.');
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateDevice() {
    setBusy('device');
    setError(null);
    try {
      await createDevice();
      await fetchStatus(false);
    } catch (e: any) {
      setError(e.message || 'Failed to generate device ID.');
    } finally {
      setBusy(null);
    }
  }

  async function copyToClipboard(value: string, key: string) {
    await Clipboard.setStringAsync(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function openTraccarClient() {
    const url = Platform.OS === 'ios' ? TRACCAR_CLIENT_IOS : TRACCAR_CLIENT_ANDROID;
    Linking.openURL(url);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator color="#38bdf8" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !status) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStatus()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const s = status!;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.pageTitle}>GPS Tracking Setup</Text>
        <Text style={styles.pageSubtitle}>
          Set up live GPS tracking so waypoints are verified automatically as you ride.
        </Text>

        {/* Ready banner */}
        {s.is_ready && (
          <View style={styles.readyBanner}>
            <Text style={styles.readyIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.readyTitle}>You're all set!</Text>
              <Text style={styles.readySubtitle}>GPS tracking is live. Waypoints will verify as you ride.</Text>
            </View>
          </View>
        )}

        {!s.traccar_enabled && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>GPS tracking is currently disabled by the administrator.</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Step 1: GPS Account ── */}
        <StepCard
          number={1}
          title="Create GPS Account"
          done={s.has_account}
          locked={false}
        >
          {!s.has_account ? (
            <TouchableOpacity
              style={[styles.actionButton, busy === 'account' && styles.actionButtonBusy]}
              onPress={handleCreateAccount}
              disabled={busy === 'account' || !s.traccar_enabled}
            >
              {busy === 'account'
                ? <ActivityIndicator color="#0f1117" size="small" />
                : <Text style={styles.actionButtonText}>Create GPS Account</Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.credentialsBox}>
              <CredRow label="Server URL" value={s.server_url} field="server_url" copied={copied} onCopy={copyToClipboard} />
              <CredRow label="Login Email" value={s.email} field="email" copied={copied} onCopy={copyToClipboard} />
              {s.password && (
                <CredRow label="Password" value={s.password} field="password" copied={copied} onCopy={copyToClipboard} secret />
              )}
            </View>
          )}
        </StepCard>

        {/* ── Step 2: Device ID ── */}
        <StepCard
          number={2}
          title="Generate Device ID"
          done={s.has_device}
          locked={!s.has_account}
        >
          {!s.has_device ? (
            <TouchableOpacity
              style={[styles.actionButton, (busy === 'device' || !s.has_account) && styles.actionButtonBusy]}
              onPress={handleCreateDevice}
              disabled={busy === 'device' || !s.has_account}
            >
              {busy === 'device'
                ? <ActivityIndicator color="#0f1117" size="small" />
                : <Text style={styles.actionButtonText}>Generate My Device ID</Text>
              }
            </TouchableOpacity>
          ) : (
            <View style={styles.deviceIdBox}>
              <Text style={styles.deviceIdLabel}>YOUR DEVICE ID</Text>
              <View style={styles.deviceIdRow}>
                <Text style={styles.deviceIdValue}>{s.device_uid}</Text>
                <TouchableOpacity
                  style={[styles.copyButton, copied === 'device_uid' && styles.copyButtonDone]}
                  onPress={() => copyToClipboard(s.device_uid!, 'device_uid')}
                >
                  <Text style={styles.copyButtonText}>
                    {copied === 'device_uid' ? '✓ Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </StepCard>

        {/* ── Step 3: Install Traccar Client ── */}
        <StepCard
          number={3}
          title="Install Traccar Client"
          done={false}
          locked={false}
          alwaysOpen
          badge="On your phone"
        >
          <TouchableOpacity style={styles.storeButton} onPress={openTraccarClient}>
            <Text style={styles.storeButtonText}>
              {Platform.OS === 'ios' ? '↗ Open App Store' : '↗ Open Play Store'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.stepNote}>After installing, open Settings and enter these values:</Text>

          <View style={styles.credentialsBox}>
            <CredRow
              label="Device identifier"
              value={s.device_uid ?? '— complete step 2 first —'}
              field="device_uid_3"
              copied={copied}
              onCopy={s.device_uid ? copyToClipboard : undefined}
            />
            <CredRow label="Server URL" value={s.server_url} field="server_url_3" copied={copied} onCopy={copyToClipboard} />
            <CredRow label="Frequency" value="30 seconds" field="freq" copied={copied} onCopy={copyToClipboard} />
          </View>

          <View style={styles.checklistBox}>
            {[
              'Set location accuracy to High, distance to 10m',
              'Enable Offline Buffering and Stop Detection',
              'Grant Always On location permission',
              'Toggle Send Location ON',
            ].map((item, i) => (
              <View key={i} style={styles.checklistItem}>
                <Text style={styles.checklistDot}>›</Text>
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>
        </StepCard>

        {/* ── Step 4: Confirm Signal ── */}
        <StepCard
          number={4}
          title="Confirm GPS Signal"
          done={s.signal?.status === 'communicating'}
          locked={!s.has_device}
        >
          {!s.has_device ? (
            <Text style={styles.lockedText}>Complete steps 1 & 2 first.</Text>
          ) : s.signal?.status === 'communicating' ? (
            <View style={styles.signalGood}>
              <Text style={styles.signalGoodIcon}>📡</Text>
              <View>
                <Text style={styles.signalGoodText}>Signal received</Text>
                {s.signal.last_update && (
                  <Text style={styles.signalTime}>Last seen: {s.signal.last_update}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.signalWaiting}>
              <ActivityIndicator color="#38bdf8" size="small" style={{ marginRight: 10 }} />
              <Text style={styles.signalWaitingText}>
                Start Traccar Client on your phone — checking every 10s...
              </Text>
            </View>
          )}
        </StepCard>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>GPS Setup</Text>
      <HamburgerButton />
    </View>
  );
}

function StepCard({
  number, title, done, locked, alwaysOpen = false, badge, children,
}: {
  number: number;
  title: string;
  done: boolean;
  locked: boolean;
  alwaysOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.stepCard, locked && styles.stepCardLocked]}>
      <View style={styles.stepHeader}>
        <View style={[
          styles.stepCircle,
          done ? styles.stepCircleDone : locked ? styles.stepCircleLocked : styles.stepCircleActive,
        ]}>
          <Text style={[styles.stepNumber, done && styles.stepNumberDone]}>
            {done ? '✓' : String(number)}
          </Text>
        </View>
        <Text style={[styles.stepTitle, locked && styles.stepTitleLocked]}>{title}</Text>
        {badge && (
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      {!locked && (
        <View style={styles.stepBody}>{children}</View>
      )}
    </View>
  );
}

function CredRow({
  label, value, field, copied, onCopy, secret = false,
}: {
  label: string;
  value: string;
  field: string;
  copied: string | null;
  onCopy?: (value: string, field: string) => void;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(!secret);

  return (
    <View style={styles.credRow}>
      <Text style={styles.credLabel}>{label}</Text>
      <View style={styles.credValueRow}>
        <Text style={styles.credValue} numberOfLines={1} selectable>
          {secret && !revealed ? '••••••••••' : value}
        </Text>
        {secret && (
          <TouchableOpacity onPress={() => setRevealed(r => !r)} style={styles.revealButton}>
            <Text style={styles.revealText}>{revealed ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
        {onCopy && (
          <TouchableOpacity
            onPress={() => onCopy(value, field)}
            style={[styles.copyButton, copied === field && styles.copyButtonDone]}
          >
            <Text style={styles.copyButtonText}>{copied === field ? '✓' : 'Copy'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 48 },

  pageTitle: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  pageSubtitle: { color: '#64748b', fontSize: 14, lineHeight: 20, marginBottom: 20 },

  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14532d',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#166534',
    gap: 12,
  },
  readyIcon: { fontSize: 22, color: '#86efac' },
  readyTitle: { color: '#86efac', fontSize: 15, fontWeight: '700' },
  readySubtitle: { color: '#4ade80', fontSize: 13, marginTop: 2 },

  warningBanner: {
    backgroundColor: '#1c1400',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#854d0e',
  },
  warningText: { color: '#fbbf24', fontSize: 13 },

  errorBanner: {
    backgroundColor: '#450a0a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: { color: '#fca5a5', fontSize: 14 },

  // Steps
  stepCard: {
    backgroundColor: '#1a2030',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 12,
    overflow: 'hidden',
  },
  stepCardLocked: { opacity: 0.5 },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: '#0f1117', borderWidth: 2, borderColor: '#38bdf8' },
  stepCircleDone: { backgroundColor: '#14532d', borderWidth: 2, borderColor: '#166534' },
  stepCircleLocked: { backgroundColor: '#1a2030', borderWidth: 2, borderColor: '#2d3748' },
  stepNumber: { color: '#38bdf8', fontSize: 13, fontWeight: '700' },
  stepNumberDone: { color: '#86efac' },
  stepTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '600', flex: 1 },
  stepTitleLocked: { color: '#475569' },
  stepBadge: {
    backgroundColor: '#1c1a0a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#854d0e',
  },
  stepBadgeText: { color: '#fbbf24', fontSize: 10, fontWeight: '600' },
  stepBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
    paddingTop: 14,
  },

  // Credentials
  credentialsBox: {
    backgroundColor: '#0f1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    overflow: 'hidden',
  },
  credRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  credLabel: { color: '#475569', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  credValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  credValue: { color: '#f1f5f9', fontSize: 13, fontFamily: 'monospace', flex: 1 },
  revealButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  revealText: { color: '#64748b', fontSize: 11 },

  // Device ID
  deviceIdBox: {
    backgroundColor: '#0f1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    padding: 14,
  },
  deviceIdLabel: { color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  deviceIdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deviceIdValue: { color: '#f1f5f9', fontSize: 22, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 1 },

  // Copy button
  copyButton: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  copyButtonDone: { borderColor: '#166534', backgroundColor: '#14532d' },
  copyButtonText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },

  // Action button
  actionButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonBusy: { opacity: 0.6 },
  actionButtonText: { color: '#0f1117', fontSize: 15, fontWeight: '700' },

  // Store button
  storeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 14,
  },
  storeButtonText: { color: '#38bdf8', fontSize: 15, fontWeight: '600' },

  stepNote: { color: '#64748b', fontSize: 13, marginBottom: 10 },

  // Checklist
  checklistBox: { marginTop: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
  checklistDot: { color: '#38bdf8', fontSize: 16, lineHeight: 18 },
  checklistText: { color: '#94a3b8', fontSize: 13, flex: 1, lineHeight: 18 },

  // Signal
  signalGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0a1a0f',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#166534',
  },
  signalGoodIcon: { fontSize: 24 },
  signalGoodText: { color: '#86efac', fontSize: 15, fontWeight: '600' },
  signalTime: { color: '#4ade80', fontSize: 12, marginTop: 2 },
  signalWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1117',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  signalWaitingText: { color: '#64748b', fontSize: 13, flex: 1 },

  lockedText: { color: '#475569', fontSize: 13 },

  retryButton: {
    backgroundColor: '#1a2030',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginTop: 12,
  },
  retryText: { color: '#38bdf8', fontWeight: '600' },
});
