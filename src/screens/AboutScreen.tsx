import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

// @ts-ignore
import { version } from '../../package.json';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function AboutScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🏍</Text>
          <Text style={styles.appName}>MotoTracker</Text>
          <Text style={styles.tagline}>Your ride. Verified.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App</Text>
          <InfoRow label="Version"  value={version} />
          <InfoRow label="Platform" value="Android" />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Server</Text>
          <InfoRow label="API"         value="app.mototracker.app" />
          <InfoRow label="Environment" value="Production" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  backButton: { width: 60 },
  backText: { color: '#38bdf8', fontSize: 15 },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  content: { padding: 24, paddingBottom: 48 },
  logoSection: { alignItems: 'center', marginBottom: 32, paddingTop: 8 },
  logoEmoji: { fontSize: 56, marginBottom: 10 },
  appName: { color: '#f1f5f9', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  tagline: { color: '#475569', fontSize: 14 },
  card: { backgroundColor: '#1a2030', borderRadius: 12, borderWidth: 1, borderColor: '#2d3748', marginBottom: 16, overflow: 'hidden' },
  cardTitle: { color: '#475569', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, padding: 14, paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2d3748' },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#f1f5f9', fontSize: 14, fontWeight: '500' },
});
