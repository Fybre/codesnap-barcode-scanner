import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Animated,
  Pressable,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { BarcodeType, BARCODE_TYPE_LABELS, ScannedBarcode } from '@/types/barcode';

const URL_REGEX = /^(https?:\/\/|www\.)[^\s]+$/i;

function isUrl(value: string): boolean {
  return URL_REGEX.test(value);
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface ScanResultItemProps {
  scan: ScannedBarcode;
  isExpanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
}

function ScanResultItem({ scan, isExpanded, onToggle, onRemove }: ScanResultItemProps) {
  const isLink = isUrl(scan.value);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(scan.value);
    Alert.alert('Copied', 'Value copied to clipboard');
  };

  const handleOpenLink = () => {
    const url = scan.value.startsWith('http') ? scan.value : `https://${scan.value}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.resultItem}>
      <Pressable onPress={onToggle} style={styles.resultHeader}>
        <View style={styles.resultHeaderLeft}>
          <Text style={styles.resultValue} numberOfLines={1}>{scan.value}</Text>
          <Text style={styles.resultType}>{BARCODE_TYPE_LABELS[scan.type]} - {formatTimestamp(scan.timestamp)}</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#8E8E93"
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.resultDetails}>
          {isLink ? (
            <TouchableOpacity onPress={handleOpenLink}>
              <Text style={styles.resultValueLink}>{scan.value}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resultValueExpanded}>{scan.value}</Text>
          )}

          <View style={styles.resultActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>

            {isLink && (
              <TouchableOpacity style={styles.actionButton} onPress={handleOpenLink}>
                <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionText}>Open</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={onRemove}
            >
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
              <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ScannerScreen() {
  const { settings, scanHistory, addScan, removeScan } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<ScannedBarcode | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const historyHeight = useRef(new Animated.Value(200)).current;
  const lastScannedValueRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const startAutoResumeCountdown = useCallback(() => {
    if (!settings.autoResume) return;

    setCountdown(settings.autoResumeDelaySeconds);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          setIsScanning(true);
          setLastScannedBarcode(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [settings.autoResume, settings.autoResumeDelaySeconds]);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (!isScanning) return;

      const barcodeType = result.type as BarcodeType;

      if (!settings.enabledBarcodeTypes.includes(barcodeType)) {
        return;
      }

      // Prevent duplicate scans of the same barcode within 1 second
      const now = Date.now();
      const timeSinceLastScan = now - lastScannedTimeRef.current;

      if (lastScannedValueRef.current === result.data && timeSinceLastScan < 1000) {
        return;
      }

      lastScannedValueRef.current = result.data;
      lastScannedTimeRef.current = now;

      // Check if this barcode already exists in history
      if (settings.ignoreDuplicates) {
        const isDuplicate = scanHistory.some(scan => scan.value === result.data);
        if (isDuplicate) {
          // Double vibration for negative feedback
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          await new Promise(resolve => setTimeout(resolve, 100));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          return;
        }
      }

      setIsScanning(false);

      const newScan: ScannedBarcode = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        value: result.data,
        type: barcodeType,
        timestamp: Date.now(),
      };

      setLastScannedBarcode(newScan);
      addScan({ value: result.data, type: barcodeType });
      setExpandedItems(prev => new Set([...prev, newScan.id]));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (settings.autoCopyToClipboard) {
        Clipboard.setStringAsync(result.data);
      }

      startAutoResumeCountdown();
    },
    [isScanning, settings.enabledBarcodeTypes, settings.autoCopyToClipboard, settings.ignoreDuplicates, scanHistory, addScan, startAutoResumeCountdown]
  );

  const handleResume = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setIsScanning(true);
    setLastScannedBarcode(null);
    lastScannedValueRef.current = null;
    lastScannedTimeRef.current = 0;
  };

  const toggleHistoryExpanded = () => {
    const toValue = historyExpanded ? 60 : 200;
    Animated.timing(historyHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setHistoryExpanded(!historyExpanded);
  };

  const toggleItemExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#8E8E93" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            This app needs camera access to scan barcodes
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          enableTorch={torchEnabled}
          barcodeScannerSettings={{
            barcodeTypes: settings.enabledBarcodeTypes,
          }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        />
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.torchButton}
            onPress={() => setTorchEnabled(prev => !prev)}
          >
            <Ionicons
              name={torchEnabled ? 'flash' : 'flash-off'}
              size={24}
              color={torchEnabled ? '#FFD60A' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {!isScanning && lastScannedBarcode && (
            <View style={styles.pausedOverlay}>
              <View style={styles.scannedInfo}>
                <Ionicons name="checkmark-circle" size={48} color="#30D158" />
                <Text style={styles.scannedTitle}>Barcode Scanned</Text>
                <Text style={styles.scannedType}>
                  {BARCODE_TYPE_LABELS[lastScannedBarcode.type]}
                </Text>
                <Text style={styles.scannedValue} numberOfLines={3}>
                  {lastScannedBarcode.value}
                </Text>

                {settings.autoResume && countdown !== null ? (
                  <Text style={styles.countdownText}>
                    Resuming in {countdown}s...
                  </Text>
                ) : null}

                <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
                  <Text style={styles.resumeButtonText}>
                    {settings.autoResume ? 'Resume Now' : 'Continue Scanning'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.historyContainer, { height: historyHeight }]}>
        <Pressable onPress={toggleHistoryExpanded} style={styles.historyHeader}>
          <Text style={styles.historyTitle}>
            Scan History ({scanHistory.length})
          </Text>
          <Ionicons
            name={historyExpanded ? 'chevron-down' : 'chevron-up'}
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        {historyExpanded && (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator>
            {scanHistory.length === 0 ? (
              <Text style={styles.emptyText}>No scans yet</Text>
            ) : (
              scanHistory.map(scan => (
                <ScanResultItem
                  key={scan.id}
                  scan={scan}
                  isExpanded={expandedItems.has(scan.id)}
                  onToggle={() => toggleItemExpanded(scan.id)}
                  onRemove={() => removeScan(scan.id)}
                />
              ))
            )}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  pausedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedInfo: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    maxWidth: 320,
  },
  scannedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  scannedType: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  scannedValue: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
  },
  resumeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  historyContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
  },
  resultItem: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  resultHeaderLeft: {
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultType: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  resultDetails: {
    padding: 12,
    paddingTop: 0,
  },
  resultValueExpanded: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  resultValueLink: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
  },
  removeText: {
    color: '#FF453A',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
