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
import { colors, radius, spacing, typography } from "./src/theme";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"events" | "tickets">("events");
  const [activeUserId, setActiveUserId] = useState<number>(getSelectedUserId());

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        {/* Main Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>OTA LIFE</Text>
            <Text style={styles.appSubtitle}>TICKETING ENGINE</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>127.0.0.1:3000</Text>
          </View>
        </View>

        {/* User Switcher Bar */}
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
                // Keep on screen or navigate as desired
              }}
            />
          ) : (
            <MyTicketsScreen
              activeUserId={activeUserId}
              onExploreEvents={() => setCurrentTab("events")}
            />
          )}
        </View>

        {/* Bottom Navigation Tabs (No emoji icons per G3) */}
        <View style={styles.bottomTabs}>
          <TouchableOpacity
            style={[styles.tabButton, currentTab === "events" && styles.tabButtonActive]}
            onPress={() => setCurrentTab("events")}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel="Events Tab"
            accessibilityState={{ selected: currentTab === "events" }}
          >
            <Text
              style={[styles.tabLabel, currentTab === "events" && styles.tabLabelActive]}
            >
              EVENTS
            </Text>
            {currentTab === "events" && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, currentTab === "tickets" && styles.tabButtonActive]}
            onPress={() => setCurrentTab("tickets")}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityLabel="My Tickets Tab"
            accessibilityState={{ selected: currentTab === "tickets" }}
          >
            <Text
              style={[styles.tabLabel, currentTab === "tickets" && styles.tabLabelActive]}
            >
              MY TICKETS
            </Text>
            {currentTab === "tickets" && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  appTitle: {
    fontSize: typography.size.heading,
    fontWeight: typography.weight.black,
    color: colors.ink,
    letterSpacing: typography.tracking.wide,
  },
  appSubtitle: {
    fontSize: typography.size.micro,
    fontWeight: typography.weight.heavy,
    color: colors.vermillion,
    letterSpacing: typography.tracking.caps,
    marginTop: 1,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.matcha,
    marginRight: 6,
  },
  statusText: {
    fontSize: typography.size.caption,
    fontFamily: "monospace",
    color: colors.inkSoft,
    fontWeight: typography.weight.semibold,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  bottomTabs: {
    flexDirection: "row",
    height: 60,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: colors.vermillionTint,
  },
  tabLabel: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  tabLabelActive: {
    color: colors.vermillion,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 4,
    width: 24,
    height: 2,
    backgroundColor: colors.vermillion,
    borderRadius: 1,
  },
});
