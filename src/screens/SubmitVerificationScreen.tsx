import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RidesStackParamList } from '../types/navigation';
import { submitVerification, VerificationResult } from '../services/verifications';

type Props = NativeStackScreenProps<RidesStackParamList, 'SubmitVerification'>;

type SubmitType = 'photo' | 'gpx';

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  preview?: string; // for photos
}

export default function SubmitVerificationScreen({ route, navigation }: Props) {
  const { ride } = route.params;

  const [submitType, setSubmitType] = useState<SubmitType>('photo');
  const [file, setFile]             = useState<SelectedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState<VerificationResult | null>(null);
  const [error, setError]           = useState<string | null>(null);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      setFile({
        uri: asset.uri,
        name,
        mimeType: asset.mimeType ?? 'image/jpeg',
        preview: asset.uri,
      });
      setError(null);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      setFile({
        uri: asset.uri,
        name,
        mimeType: asset.mimeType ?? 'image/jpeg',
        preview: asset.uri,
      });
      setError(null);
    }
  }

  async function pickGpx() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/gpx+xml', 'application/xml', 'text/xml', '*/*'],
      copyToCacheDirectory: true,
    });

    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      if (!asset.name.toLowerCase().endsWith('.gpx')) {
        setError('Please select a .gpx file.');
        return;
      }
      setFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/gpx+xml',
      });
      setError(null);
    }
  }

  async function handleSubmit() {
    if (!file) { setError('Please select a file to submit.'); return; }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitVerification(submitType, file.uri, file.name, file.mimeType);
      setResult(res);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Success/result screen
  if (result) {
    const hasHits = result.new_hits > 0;
    const hasMatches = result.matched_waypoints > 0;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.resultContainer}>
          <Text style={[styles.resultIcon, hasHits ? styles.iconAccepted : styles.iconPending]}>
            {hasHits ? '✓' : hasMatches ? '⏳' : '📋'}
          </Text>
          <Text style={styles.resultTitle}>
            {hasHits
              ? `${result.new_hits} Waypoint${result.new_hits !== 1 ? 's' : ''} Hit!`
              : hasMatches
              ? 'Submitted for Review'
              : 'Upload Received'}
          </Text>
          <Text style={styles.resultReason}>
            {hasHits
              ? `${result.matched_waypoints} waypoint${result.matched_waypoints !== 1 ? 's' : ''} matched — ${result.new_hits} new hit${result.new_hits !== 1 ? 's' : ''} credited.`
              : hasMatches
              ? `${result.matched_waypoints} waypoint${result.matched_waypoints !== 1 ? 's' : ''} matched and submitted for manual review.`
              : 'No eligible waypoints were matched. Check that you are joined to an active ride and your evidence covers a waypoint location.'}
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Back to Ride</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Evidence</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.rideName}>{ride.name}</Text>

        {/* Type toggle */}
        <Text style={styles.label}>Evidence Type</Text>
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeOption, submitType === 'photo' && styles.typeOptionSelected]}
            onPress={() => { setSubmitType('photo'); setFile(null); }}
          >
            <Text style={[styles.typeOptionText, submitType === 'photo' && styles.typeOptionTextSelected]}>
              Photo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeOption, submitType === 'gpx' && styles.typeOptionSelected]}
            onPress={() => { setSubmitType('gpx'); setFile(null); }}
          >
            <Text style={[styles.typeOptionText, submitType === 'gpx' && styles.typeOptionTextSelected]}>
              GPX Track
            </Text>
          </TouchableOpacity>
        </View>

        {/* File selection */}
        {submitType === 'photo' ? (
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.fileButton} onPress={takePhoto}>
              <Text style={styles.fileButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.fileButton, styles.fileButtonSecondary]} onPress={pickPhoto}>
              <Text style={styles.fileButtonTextSecondary}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.fileButton} onPress={pickGpx}>
            <Text style={styles.fileButtonText}>Select GPX File</Text>
          </TouchableOpacity>
        )}

        {/* Preview */}
        {file && (
          <View style={styles.filePreview}>
            {file.preview ? (
              <Image source={{ uri: file.preview }} style={styles.photoPreview} resizeMode="cover" />
            ) : (
              <View style={styles.gpxPreview}>
                <Text style={styles.gpxIcon}>📍</Text>
                <Text style={styles.gpxFileName}>{file.name}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setFile(null)} style={styles.removeFile}>
              <Text style={styles.removeFileText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, (!file || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={!file || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#0f1117" />
            : <Text style={styles.submitButtonText}>Submit Evidence</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2030',
  },
  backButton: { paddingVertical: 4 },
  backText: { color: '#38bdf8', fontSize: 16 },
  headerTitle: { color: '#f1f5f9', fontSize: 17, fontWeight: '600' },
  scrollContent: { padding: 20, paddingBottom: 48 },
  rideName: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1a2030',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 24,
    overflow: 'hidden',
  },
  typeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  typeOptionSelected: {
    backgroundColor: '#38bdf8',
  },
  typeOptionText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  typeOptionTextSelected: {
    color: '#0f1117',
  },
  photoActions: {
    gap: 10,
    marginBottom: 16,
  },
  fileButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  fileButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  fileButtonText: {
    color: '#0f1117',
    fontWeight: '700',
    fontSize: 15,
  },
  fileButtonTextSecondary: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 15,
  },
  filePreview: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  photoPreview: {
    width: '100%',
    height: 200,
  },
  gpxPreview: {
    backgroundColor: '#1a2030',
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  gpxIcon: { fontSize: 24 },
  gpxFileName: { color: '#94a3b8', fontSize: 14, flex: 1 },
  removeFile: {
    backgroundColor: '#1a2030',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  removeFileText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#450a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: { color: '#fca5a5', fontSize: 14 },
  submitButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.4 },
  submitButtonText: { color: '#0f1117', fontSize: 16, fontWeight: '700' },
  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultIcon: { fontSize: 64, marginBottom: 16 },
  iconAccepted: { color: '#86efac' },
  iconPending: { color: '#fbbf24' },
  resultTitle: {
    color: '#f1f5f9',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultReason: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  doneButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: { color: '#0f1117', fontSize: 16, fontWeight: '700' },
});
