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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerProvider } from '../context/DrawerContext';
import { RootStackParamList } from '../types/navigation';

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

function DrawerContent({ onClose }: { onClose: () => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function navigate(screen: keyof RootStackParamList) {
    onClose();
    setTimeout(() => navigation.navigate(screen), 250);
  }

  const menuItems: MenuItem[] = [
    { key: 'leaderboard', icon: '🏆', label: 'Leaderboard', onPress: () => navigate('Leaderboard') },
    { key: 'about',       icon: 'ℹ️',  label: 'About',       onPress: () => navigate('About')       },
  ];

  return (
    <SafeAreaView style={styles.drawerInner} edges={['top', 'bottom']}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>MotoTracker</Text>
        <Text style={styles.drawerTagline}>Your ride. Verified.</Text>
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
  );
}

export default function AppDrawer({ children }: Props) {
  const [drawerVisible, setDrawerVisible] = useState(false);
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

  return (
    <DrawerProvider onOpen={openDrawer}>
      {children}

      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <DrawerContent onClose={closeDrawer} />
        </Animated.View>
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
  drawerInner: { flex: 1, paddingBottom: 32 },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
    marginBottom: 8,
  },
  drawerTitle:   { color: '#f1f5f9', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  drawerTagline: { color: '#38bdf8', fontSize: 12, letterSpacing: 0.5 },
  nav:     { flex: 1, paddingTop: 8 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, gap: 14 },
  navIcon:  { fontSize: 20, width: 28, textAlign: 'center' },
  navLabel: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  drawerFooter: { paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#1a2030', paddingTop: 20 },
  footerText: { color: '#334155', fontSize: 12 },
});
