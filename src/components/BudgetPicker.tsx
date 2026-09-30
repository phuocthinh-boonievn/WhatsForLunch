import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';

export type BudgetOption = { value: string; label: string };

type Props = {
  budget: string;
  custom: string;
  options: readonly BudgetOption[];
  disabled?: boolean;
  valid: boolean;
  note?: string | null;
  error?: string | null;
  onBudget: (value: string) => void;
  onCustom: (value: string) => void;
};

export function BudgetPicker({
  budget,
  custom,
  options,
  disabled,
  valid,
  note,
  error,
  onBudget,
  onCustom,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === budget);
  const label = budget === 'custom' ? 'Tuỳ chỉnh' : (selected?.label ?? budget);

  return (
    <View style={styles.wrap}>
      <Text nativeID="budget-label" style={styles.label}>
        Ngân sách bữa ăn
      </Text>
      <Pressable
        accessibilityLabel="Ngân sách bữa ăn"
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <Text style={styles.triggerText}>{label}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {budget === 'custom' ? (
        <View style={styles.customRow}>
          <TextInput
            accessibilityLabel="Mức chi tuỳ chỉnh (nghìn đồng)"
            keyboardType="number-pad"
            inputMode="numeric"
            value={custom}
            editable={!disabled}
            onChangeText={onCustom}
            style={[styles.input, !valid && styles.inputInvalid]}
          />
          <Text style={styles.unit}>nghìn / bữa</Text>
        </View>
      ) : null}
      {!valid && error ? (
        <Text accessibilityRole="alert" style={styles.note}>
          {error}
        </Text>
      ) : note ? (
        <Text style={styles.note}>{note}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menu}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onBudget(option.value);
                  setOpen(false);
                }}
                style={styles.option}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                onBudget('custom');
                setOpen(false);
              }}
              style={styles.option}
            >
              <Text style={styles.optionText}>Tuỳ chỉnh</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    minWidth: 195,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#c2c8cd',
    marginBottom: 8,
  },
  trigger: {
    minWidth: 195,
    height: 36,
    backgroundColor: '#1e2b3680',
    borderWidth: 1,
    borderColor: '#ffffff35',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerText: {
    color: colors.text,
    fontSize: 14,
  },
  chevron: {
    color: colors.muted,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  input: {
    width: 90,
    minHeight: 40,
    backgroundColor: '#25333d',
    borderWidth: 1,
    borderColor: '#ffffff35',
    color: '#fff',
    paddingHorizontal: 8,
    fontSize: 16,
  },
  inputInvalid: {
    borderColor: colors.invalid,
  },
  unit: {
    color: '#bfc5cc',
    fontSize: 12,
  },
  note: {
    marginTop: 8,
    color: '#c2cbd2',
    fontSize: 12,
    maxWidth: 280,
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    padding: 32,
  },
  menu: {
    backgroundColor: '#35424c',
    borderWidth: 1,
    borderColor: '#ffffff26',
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ffffff20',
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
  },
});
