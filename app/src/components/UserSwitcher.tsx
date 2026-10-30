import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getSelectedUserId, setSelectedUserId } from "../api/client";
import { colors, radius, spacing, typography } from "../theme";

interface Props {
  currentUserId: number;
  onUserChange?: (userId: number) => void;
}

const USERS = [
  { id: 1, name: "Alice", role: "Fan 1" },
  { id: 2, name: "Bob", role: "Fan 2" },
  { id: 3, name: "Charlie", role: "Fan 3" },
];

export function UserSwitcher({ currentUserId, onUserChange }: Props) {
  const handleSelect = (userId: number) => {
    setSelectedUserId(userId);
    onUserChange?.(userId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ACTIVE IDENTITY (X-User-Id):</Text>
      <View style={styles.buttonsRow}>
        {USERS.map((user) => {
          const isSelected = user.id === currentUserId;
          return (
            <TouchableOpacity
              key={user.id}
              style={[styles.userButton, isSelected && styles.userButtonSelected]}
              onPress={() => handleSelect(user.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Switch active user identity to ${user.name}`}
            >
              <Text
                style={[
                  styles.userName,
                  isSelected && styles.userNameSelected,
                ]}
              >
                #{user.id} {user.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.bold,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
    marginBottom: spacing.xs,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  userButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  userButtonSelected: {
    backgroundColor: colors.vermillion,
    borderColor: colors.vermillion,
  },
  userName: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
    color: colors.inkSoft,
  },
  userNameSelected: {
    color: colors.card,
  },
});
