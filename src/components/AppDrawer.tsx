import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerProvider } from '../context/DrawerContext';
import LeaderboardModal from './LeaderboardModal';

// @ts-ignore
import { version } from '../../package.json';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.72;

interface MenuItem {
  key: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface Props {
  children: React.ReactNode;
}

function AboutContent() {
  function InfoRow({ label, value }: { label: string; value: string }) {
    return (
      <View style={aboutStyles.row}>
        <Text style={aboutStyles.rowLabel}>{label}</Text>
        <Text style={aboutStyles.rowValue}>{value}</Text>
      </View>
    );
  }
  return (
    <ScrollView style={aboutStyles.container} contentContainerStyle={aboutStyles.content}>
      <View style={aboutStyles.logoSection}>
        <Text style={aboutStyles.logoEmoji}>🏍</Text>
        <Text style={aboutStyles.appName}>MotoTracker</Text>
        <Text style={aboutStyles.tagline}>Rally & Explorer Ride Tracking</Text>
      </View>
      <View style={aboutStyles.card}>
        <Text style={aboutStyles.cardTitle}>App</Text>
        <InfoRow label="Version"  value={version} />
        <InfoRow label="Platform" value="Android" />
      </View>
      <View style={aboutStyles.card}>
        <Text style={aboutStyles.cardTitle}>Server</Text>
        <InfoRow label="API"         value="app.mototracker.app" />
        <InfoRow label="Environment" value="Production" />
      </View>
    </ScrollView>
  );
}

export default function AppDrawer({ children }: Props) {
  const [drawerVisible,      setDrawerVisible]      = useState(false);
  const [aboutVisible,       setAboutVisible]       = useState(false);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (drawerVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 14 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [drawerVisible]);

  function openDrawer()  { setDrawerVisible(true); }
  function closeDrawer() { setDrawerVisible(false); }

  const menuItems: MenuItem[] = [
    {
      key: 'leaderboard',
      icon: '🏆',
      label: 'Leaderboard',
      onPress: () => { closeDrawer(); setTimeout(() => setLeaderboardVisible(true), 250); },
    },
    {
      key: 'about',
      icon: 'ℹ️',
      label: 'About',
      onPress: () => { closeDrawer(); setTimeout(() => setAboutVisible(true), 250); },
    },
  ];

  return (
    <DrawerProvider onOpen={openDrawer}>
      {children}

      {/* Sliding drawer */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView style={styles.drawerInner} edges={['top', 'bottom']}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>MotoTracker</Text>
              <Text style={styles.drawerTagline}>Ride. Explore. Conquer.</Text>
            </View>

            <View style={styles.nav}>
              {menuItems.map(item => (
                <TouchableOpacity key={item.key} style={styles.navItem} onPress={item.onPress} activeOpacity={0.7}>
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={styles.navLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.drawerFooter}>
              <Text style={styles.footerText}>mototracker.app</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>

      {/* Leaderboard modal */}
      <LeaderboardModal
        visible={leaderboardVisible}
        onClose={() => setLeaderboardVisible(false)}
      />

      {/* About modal */}
      <Modal visible={aboutVisible} animationType="slide" onRequestClose={() => setAboutVisible(false)}>
        <SafeAreaView style={styles.aboutModal} edges={['top']}>
          <View style={styles.aboutHeader}>
            <TouchableOpacity onPress={() => setAboutVisible(false)}>
              <Text style={styles.aboutBack}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.aboutHeaderTitle}>About</Text>
            <View style={{ width: 60 }} />
          </View>
          <AboutContent />
        </SafeAreaView>
      </Modal>
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#090c12',
    borderLeftWidth: 1,
    borderLeftColor: '#1a2030',
  },
  drawerInner: {
    flex: 1,
    paddingBottom: 32,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
    marginBottom: 8,
  },
  drawerTitle: { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  drawerTagline: { color: '#38bdf8', fontSize: 12, letterSpacing: 0.5 },
  nav: { flex: 1, paddingTop: 8 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  navIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  navLabel: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  drawerFooter: {
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a2030',
    paddingTop: 20,
  },
  footerText: { color: '#334155', fontSize: 12 },
  aboutModal: { flex: 1, backgroundColor: '#0f1117' },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  aboutHeaderTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  aboutBack: { color: '#38bdf8', fontSize: 15, width: 60 },
});

const aboutStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 24, paddingBottom: 48 },
  logoSection: { alignItems: 'center', marginBottom: 32, paddingTop: 8 },
  logoEmoji: { fontSize: 56, marginBottom: 10 },
  appName: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  tagline: { color: '#475569', fontSize: 14 },
  card: {
    backgroundColor: '#1a2030',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '500' },
});
