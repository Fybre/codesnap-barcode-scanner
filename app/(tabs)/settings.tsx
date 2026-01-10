import { useApp } from "@/context/AppContext";
import { ALL_BARCODE_TYPES, BARCODE_TYPE_LABELS } from "@/types/barcode";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { File, Paths } from "expo-file-system/next";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    settings,
    updateSettings,
    toggleBarcodeType,
    clearHistory,
    scanHistory,
  } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportHistory = async () => {
    if (scanHistory.length === 0) {
      Alert.alert("No History", "There are no scans to export.");
      return;
    }

    setIsExporting(true);

    try {
      const csvHeader = "Value,Type,Date,Time\n";
      const csvRows = scanHistory
        .map((scan) => {
          const date = new Date(scan.timestamp);
          const dateStr = date.toLocaleDateString();
          const timeStr = date.toLocaleTimeString();
          const escapedValue = `"${scan.value.replace(/"/g, '""')}"`;
          return `${escapedValue},${
            BARCODE_TYPE_LABELS[scan.type]
          },${dateStr},${timeStr}`;
        })
        .join("\n");

      const csvContent = csvHeader + csvRows;
      const fileName = `CodeSnap_Export_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      const file = new File(Paths.cache, fileName);

      await file.write(csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Scan History",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Error", "Failed to export scan history.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearHistory = () => {
    if (scanHistory.length === 0) {
      Alert.alert("No History", "There are no scans to clear.");
      return;
    }

    Alert.alert(
      "Clear History",
      `Are you sure you want to clear all ${scanHistory.length} scanned barcodes?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearHistory },
      ]
    );
  };

  const handleSelectAll = () => {
    updateSettings({ enabledBarcodeTypes: [...ALL_BARCODE_TYPES] });
  };

  const handleDeselectAll = () => {
    updateSettings({ enabledBarcodeTypes: [] });
  };

  const enabledCount = settings.enabledBarcodeTypes.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scanning Behavior</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Copy to clipboard</Text>
            <Text style={styles.settingDescription}>
              Automatically copy barcode value when scanned
            </Text>
          </View>
          <Switch
            value={settings.autoCopyToClipboard}
            onValueChange={(value) =>
              updateSettings({ autoCopyToClipboard: value })
            }
            trackColor={{ false: "#3A3A3C", true: "#30D158" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Ignore duplicates</Text>
            <Text style={styles.settingDescription}>
              Skip barcodes that already exist in history
            </Text>
          </View>
          <Switch
            value={settings.ignoreDuplicates}
            onValueChange={(value) =>
              updateSettings({ ignoreDuplicates: value })
            }
            trackColor={{ false: "#3A3A3C", true: "#30D158" }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-resume scanning</Text>
            <Text style={styles.settingDescription}>
              Automatically continue scanning after a barcode is detected
            </Text>
          </View>
          <Switch
            value={settings.autoResume}
            onValueChange={(value) => updateSettings({ autoResume: value })}
            trackColor={{ false: "#3A3A3C", true: "#30D158" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {settings.autoResume && (
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Resume delay: {settings.autoResumeDelaySeconds} seconds
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={settings.autoResumeDelaySeconds}
              onValueChange={(value) =>
                updateSettings({ autoResumeDelaySeconds: value })
              }
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#3A3A3C"
              thumbTintColor="#FFFFFF"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinMax}>1s</Text>
              <Text style={styles.sliderMinMax}>10s</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportHistory}
          disabled={isExporting}
        >
          <Ionicons name="share-outline" size={20} color="#007AFF" />
          <Text style={styles.exportButtonText}>
            {isExporting ? "Exporting..." : "Export History to CSV"}
          </Text>
          <Text style={styles.historyCount}>({scanHistory.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearHistory}
        >
          <Ionicons name="trash-outline" size={20} color="#FF453A" />
          <Text style={styles.dangerButtonText}>Clear Scan History</Text>
          <Text style={styles.historyCount}>({scanHistory.length})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barcode Types</Text>
          <Text style={styles.sectionSubtitle}>
            {enabledCount} of {ALL_BARCODE_TYPES.length} enabled
          </Text>
        </View>

        <View style={styles.bulkActions}>
          <TouchableOpacity style={styles.bulkButton} onPress={handleSelectAll}>
            <Ionicons name="checkmark-done" size={18} color="#007AFF" />
            <Text style={styles.bulkButtonText}>Select All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bulkButton}
            onPress={handleDeselectAll}
          >
            <Ionicons name="close-circle-outline" size={18} color="#8E8E93" />
            <Text style={[styles.bulkButtonText, styles.bulkButtonTextMuted]}>
              Deselect All
            </Text>
          </TouchableOpacity>
        </View>

        {ALL_BARCODE_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={styles.barcodeTypeRow}
            onPress={() => toggleBarcodeType(type)}
            activeOpacity={0.7}
          >
            <View style={styles.barcodeTypeInfo}>
              <Text style={styles.barcodeTypeName}>
                {BARCODE_TYPE_LABELS[type]}
              </Text>
              <Text style={styles.barcodeTypeCode}>{type}</Text>
            </View>
            <View
              style={[
                styles.checkbox,
                settings.enabledBarcodeTypes.includes(type) &&
                  styles.checkboxChecked,
              ]}
            >
              {settings.enabledBarcodeTypes.includes(type) && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.aboutButton}
          onPress={() => router.push("/about")}
        >
          <View style={styles.aboutButtonLeft}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#007AFF"
            />
            <Text style={styles.aboutButtonText}>About CodeSnap</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CodeSnap</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
    paddingRight: 16,
    paddingTop: 16,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#38383A",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  settingDescription: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 4,
  },
  sliderContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderMinMax: {
    fontSize: 12,
    color: "#8E8E93",
  },
  bulkActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  bulkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bulkButtonText: {
    fontSize: 14,
    color: "#007AFF",
  },
  bulkButtonTextMuted: {
    color: "#8E8E93",
  },
  barcodeTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#38383A",
  },
  barcodeTypeInfo: {
    flex: 1,
  },
  barcodeTypeName: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  barcodeTypeCode: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3A3A3C",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#38383A",
  },
  exportButtonText: {
    fontSize: 16,
    color: "#007AFF",
    flex: 1,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 16,
    color: "#FF453A",
  },
  historyCount: {
    fontSize: 14,
    color: "#8E8E93",
  },
  aboutButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  aboutButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aboutButtonText: {
    fontSize: 16,
    color: "#007AFF",
  },
  footer: {
    padding: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#3A3A3C",
  },
});
