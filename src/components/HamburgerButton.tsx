import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useDrawer } from '../context/DrawerContext';

export default function HamburgerButton() {
  const { openDrawer } = useDrawer();
  return (
    <TouchableOpacity onPress={openDrawer} style={styles.button} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { gap: 5, justifyContent: 'center' },
  line: { width: 22, height: 2, backgroundColor: '#f1f5f9', borderRadius: 2 },
});
