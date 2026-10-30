import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { getSelectedUserId, setSelectedUserId } from "../api/client";

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
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#12141F",
    borderBottomWidth: 1,
    borderBottomColor: "#202334",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B728E",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  userButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#161824",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#26293A",
  },
  userButtonSelected: {
    backgroundColor: "#FF3366",
    borderColor: "#FF3366",
  },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9EA2B6",
  },
  userNameSelected: {
    color: "#FFFFFF",
  },
});
