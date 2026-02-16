import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useTheme } from '@/hooks/useTheme';

interface DropdownProps {
  value: string | number;
  items: Array<{ label: string; value: string | number }>;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
}

export default function Dropdown({
  value,
  items,
  onValueChange,
  placeholder = 'Select...',
}: DropdownProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === value);

  const handleSelect = (itemValue: string | number) => {
    onValueChange(itemValue);
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.selectorText}>
          {selectedItem?.label || placeholder}
        </ThemedText>
        <ThemedText style={styles.arrow}>▼</ThemedText>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <ThemedView
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <ThemedText style={styles.headerText}>
                  Select Option
                </ThemedText>
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <ThemedText style={styles.closeButton}>✕</ThemedText>
                </TouchableOpacity>
              </View>

              <FlatList
                data={items}
                keyExtractor={(item) => String(item.value)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          item.value === value ? colors.primary + '20' : 'transparent',
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.optionText,
                        item.value === value && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                    {item.value === value && (
                      <ThemedText style={{ color: colors.primary }}>✓</ThemedText>
                    )}
                  </TouchableOpacity>
                )}
                style={styles.list}
              />
            </ThemedView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 12,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '300',
  },
  list: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
  },
});