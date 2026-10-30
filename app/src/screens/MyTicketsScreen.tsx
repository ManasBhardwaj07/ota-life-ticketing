import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ticket } from "../types";
import { fetchApi, ApiError } from "../api/client";
import { TicketCard } from "../components/TicketCard";
import { TicketCardSkeleton } from "../components/TicketCardSkeleton";
import { ErrorView } from "../components/ErrorView";
import { colors, radius, spacing, typography } from "../theme";

interface Props {
  activeUserId: number;
  onExploreEvents?: () => void;
}

export function MyTicketsScreen({ activeUserId, onExploreEvents }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchApi<Ticket[]>("/me/tickets");
      setTickets(data);
    } catch (err: any) {
      const code = err instanceof ApiError ? err.code : undefined;
      const message = err.message || "Failed to load tickets";
      setError({ message, code });

      if (isRefresh) {
        Alert.alert(
          "Connection Offline",
          message,
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    setTickets([]);
    loadTickets();
  }, [loadTickets, activeUserId]);

  if (loading && !refreshing && tickets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.listContent}>
          <TicketCardSkeleton />
        </View>
      </View>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <ErrorView
        title="Could not load tickets"
        message={error.message}
        code={error.code}
        onRetry={() => loadTickets()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTickets(true)}
            tintColor={colors.vermillion}
            colors={[colors.vermillion]}
          />
        }
        ListHeaderComponent={
          tickets.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>YOUR PASSES ({tickets.length})</Text>
              <Text style={styles.headerSubtitle}>
                Pull down to refresh gate scan status after entry.
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {/* Labeled glyph box replacing emoji per G3 */}
            <View style={styles.glyphBox}>
              <View style={styles.ticketStubOutline}>
                <View style={styles.stubHole} />
                <View style={styles.stubLine} />
              </View>
            </View>

            <Text style={styles.emptyTitle}>NO TICKETS FOUND</Text>
            <Text style={styles.emptySubtitle}>
              No admissions are currently registered under Fan #{activeUserId}. Book your ticket from the Events tab.
            </Text>

            {onExploreEvents && (
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={onExploreEvents}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Browse upcoming events"
              >
                <Text style={styles.exploreButtonText}>BROWSE EVENTS</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => <TicketCard ticket={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  headerSubtitle: {
    fontSize: typography.size.sub,
    color: colors.inkSoft,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: spacing.xxl,
  },
  glyphBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ticketStubOutline: {
    width: 34,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    borderColor: colors.inkSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  stubHole: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.inkSoft,
  },
  stubLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
    marginLeft: 4,
  },
  emptyTitle: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
    color: colors.ink,
    letterSpacing: typography.tracking.tight,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.size.body,
    color: colors.inkSoft,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  exploreButton: {
    backgroundColor: colors.vermillion,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
  },
  exploreButtonText: {
    color: colors.card,
    fontSize: typography.size.sub,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
});
