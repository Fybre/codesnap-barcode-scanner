import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

interface LibraryInfo {
  name: string;
  license: string;
  url: string;
}

const LIBRARIES: LibraryInfo[] = [
  {
    name: 'Expo',
    license: 'MIT',
    url: 'https://github.com/expo/expo',
  },
  {
    name: 'React Native',
    license: 'MIT',
    url: 'https://github.com/facebook/react-native',
  },
  {
    name: 'React Navigation',
    license: 'MIT',
    url: 'https://github.com/react-navigation/react-navigation',
  },
  {
    name: 'Expo Camera',
    license: 'MIT',
    url: 'https://github.com/expo/expo/tree/main/packages/expo-camera',
  },
  {
    name: 'Async Storage',
    license: 'MIT',
    url: 'https://github.com/react-native-async-storage/async-storage',
  },
  {
    name: 'Ionicons',
    license: 'MIT',
    url: 'https://github.com/ionic-team/ionicons',
  },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? '1';

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="scan" size={48} color="#007AFF" />
        </View>
        <Text style={styles.appName}>CodeSnap</Text>
        <Text style={styles.version}>Version {version} ({buildNumber})</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>
          CodeSnap is a fast and simple barcode scanner that supports multiple barcode formats including QR codes, UPC, EAN, Code 128, and more.
        </Text>
        <Text style={styles.description}>
          This app is open source software, licensed under the MIT License.
        </Text>
        <TouchableOpacity
          style={styles.githubRow}
          onPress={() => openUrl('https://github.com/Fybre/codesnap-barcode-scanner')}
        >
          <Ionicons name="logo-github" size={20} color="#FFFFFF" />
          <Text style={styles.githubText}>View on GitHub</Text>
          <Ionicons name="open-outline" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Open Source Libraries</Text>
        <Text style={styles.attributionNote}>
          This app is built with the following open source libraries:
        </Text>

        {LIBRARIES.map((lib, index) => (
          <TouchableOpacity
            key={lib.name}
            style={[
              styles.libraryRow,
              index === LIBRARIES.length - 1 && styles.libraryRowLast,
            ]}
            onPress={() => openUrl(lib.url)}
          >
            <View style={styles.libraryInfo}>
              <Text style={styles.libraryName}>{lib.name}</Text>
              <Text style={styles.libraryLicense}>{lib.license} License</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with Expo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  version: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingBottom: 12,
    lineHeight: 20,
  },
  githubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 12,
    marginHorizontal: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  githubText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  attributionNote: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  libraryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#38383A',
  },
  libraryRowLast: {
    borderBottomWidth: 0,
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  libraryLicense: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#3A3A3C',
  },
});
