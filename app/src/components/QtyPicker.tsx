import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, radius, spacing, typography } from "../theme";

interface Props {
  value: number;
  onChange: (qty: number) => void;
  max?: number;
  disabled?: boolean;
}

export function QtyPicker({ value, onChange, max = 4, disabled = false }: Props) {
  const effectiveMax = Math.min(4, Math.max(1, max));

  const handleDecrement = () => {
    if (disabled || value <= 1) return;
    onChange(value - 1);
  };

  const handleIncrement = () => {
    if (disabled || value >= effectiveMax) return;
    onChange(value + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelCol}>
        <Text style={styles.label}>QUANTITY</Text>
        <Text style={styles.sublabel}>Max {effectiveMax} per order</Text>
      </View>

      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.btn, (disabled || value <= 1) && styles.btnDisabled]}
          onPress={handleDecrement}
          disabled={disabled || value <= 1}
          activeOpacity={0.7}
          accessibilityLabel="Decrease ticket quantity"
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, (disabled || value <= 1) && styles.textDisabled]}>−</Text>
        </TouchableOpacity>

        <Text style={styles.valueText}>{value}</Text>

        <TouchableOpacity
          style={[styles.btn, (disabled || value >= effectiveMax) && styles.btnDisabled]}
          onPress={handleIncrement}
          disabled={disabled || value >= effectiveMax}
          activeOpacity={0.7}
          accessibilityLabel="Increase ticket quantity"
          accessibilityRole="button"
        >
          <Text style={[styles.btnText, (disabled || value >= effectiveMax) && styles.textDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  labelCol: {
    justifyContent: "center",
  },
  label: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  sublabel: {
    fontSize: typography.size.micro,
    color: colors.inkSoft,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.line,
    gap: spacing.md,
  },
  btn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnDisabled: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    opacity: 0.4,
  },
  btnText: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    color: colors.ink,
    lineHeight: 22,
  },
  textDisabled: {
    color: colors.inkSoft,
  },
  valueText: {
    fontSize: 18,
    fontWeight: typography.weight.heavy,
    color: colors.ink,
    minWidth: 20,
    textAlign: "center",
  },
});
