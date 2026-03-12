import React, { useRef, useEffect } from 'react';
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

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.72;

interface Props {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const MENU_ITEMS = [
  { screen: 'RideList', icon: '🏍', label: 'Rides' },
  { screen: 'Profile',  icon: '👤', label: 'Profile' },
];

export default function DrawerMenu({ visible, onClose, onNavigate }: Props) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 14,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dimmed overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>

        {/* Header */}
        <View style={styles.drawerHeader}>
          <Text style={styles.appName}>MotoTracker</Text>
          <Text style={styles.appTagline}>Ride. Explore. Conquer.</Text>
        </View>

        {/* Nav items */}
        <View style={styles.nav}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.screen}
              style={styles.navItem}
              onPress={() => { onNavigate(item.screen); onClose(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.drawerFooter}>
          <Text style={styles.footerText}>mototracker.app</Text>
        </View>

      </Animated.View>
    </Modal>
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
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#090c12',
    borderRightWidth: 1,
    borderRightColor: '#1a2030',
    paddingTop: 60,
    paddingBottom: 32,
    flexDirection: 'column',
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
    marginBottom: 12,
  },
  appName: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    color: '#38bdf8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nav: {
    flex: 1,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 14,
  },
  navIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  navLabel: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
  },
  drawerFooter: {
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1a2030',
    paddingTop: 20,
  },
  footerText: {
    color: '#334155',
    fontSize: 12,
  },
});
