import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import DrawerMenu from './DrawerMenu';
import { RootStackParamList } from '../types/navigation';

interface Props {
  title: string;
  navigation: NavigationProp<RootStackParamList>;
  showBack?: boolean;
}

export default function AppHeader({ title, navigation, showBack = false }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={styles.header}>
        {showBack ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sideButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.sideButton}>
            <View style={styles.hamburger}>
              <View style={styles.line} />
              <View style={[styles.line, styles.lineMiddle]} />
              <View style={styles.line} />
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {/* Right spacer matches left side width */}
        <View style={styles.sideButton} />
      </View>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={screen => navigation.navigate(screen as any)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
    backgroundColor: '#0f1117',
  },
  sideButton: {
    width: 44,
    justifyContent: 'center',
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
  },
  hamburger: {
    gap: 5,
    paddingVertical: 4,
  },
  line: {
    width: 22,
    height: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 1,
  },
  lineMiddle: {
    width: 16,
  },
  title: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
});
