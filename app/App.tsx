import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { EventsScreen } from "./src/screens/EventsScreen";
import { MyTicketsScreen } from "./src/screens/MyTicketsScreen";
import { UserSwitcher } from "./src/components/UserSwitcher";
import { getSelectedUserId } from "./src/api/client";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"events" | "tickets">("events");
  const [activeUserId, setActiveUserId] = useState<number>(getSelectedUserId());

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

      {/* Main Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>OTA LIFE</Text>
          <Text style={styles.appSubtitle}>Mini Ticketing Engine</Text>
        </View>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>127.0.0.1:3000</Text>
        </View>
      </View>

      {/* User Switcher Bar (R4 / P4 Requirement) */}
      <UserSwitcher
        currentUserId={activeUserId}
        onUserChange={(uid) => setActiveUserId(uid)}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentTab === "events" ? (
          <EventsScreen
            activeUserId={activeUserId}
            onBookingSuccess={() => {
              // Optionally stay or switch tabs
            }}
          />
        ) : (
          <MyTicketsScreen
            activeUserId={activeUserId}
            onExploreEvents={() => setCurrentTab("events")}
          />
        )}
      </View>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabs}>
        <TouchableOpacity
          style={[styles.tabButton, currentTab === "events" && styles.tabButtonActive]}
          onPress={() => setCurrentTab("events")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, currentTab === "events" && styles.tabIconActive]}>
            🎪
          </Text>
          <Text
            style={[styles.tabLabel, currentTab === "events" && styles.tabLabelActive]}
          >
            Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, currentTab === "tickets" && styles.tabButtonActive]}
          onPress={() => setCurrentTab("tickets")}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabIcon, currentTab === "tickets" && styles.tabIconActive]}>
            🎟️
          </Text>
          <Text
            style={[styles.tabLabel, currentTab === "tickets" && styles.tabLabelActive]}
          >
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </SafeAreaProvider>
);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D0E15",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#0D0E15",
    borderBottomWidth: 1,
    borderBottomColor: "#1A1C28",
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  appSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF3366",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161824",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#282A3A",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00E699",
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#9EA2B6",
    fontWeight: "600",
  },
  screenContainer: {
    flex: 1,
  },
  bottomTabs: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#12141F",
    borderTopWidth: 1,
    borderTopColor: "#202334",
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 51, 102, 0.12)",
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B728E",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#FF3366",
    fontWeight: "700",
  },
});
