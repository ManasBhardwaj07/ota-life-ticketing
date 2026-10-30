import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ticket } from "../types";
import { fetchApi, ApiError } from "../api/client";
import { TicketCard } from "../components/TicketCard";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";

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
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<Ticket[]>("/me/tickets");
      setTickets(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      } else {
        setError({ message: err.message || "Failed to load tickets" });
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

  if (loading && !refreshing) {
    return <LoadingView message="Loading your tickets..." />;
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
            tintColor="#FF3366"
            colors={["#FF3366"]}
          />
        }
        ListHeaderComponent={
          tickets.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>YOUR PASSES ({tickets.length})</Text>
              <Text style={styles.headerSubtitle}>
                Pull down to refresh scan status after gate check-in.
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>🎟️</Text>
            </View>
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptySubtitle}>
              You haven't booked any tickets under this identity (#{activeUserId}). Book tickets from the Events tab or switch users.
            </Text>
            {onExploreEvents && (
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={onExploreEvents}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>Browse Events</Text>
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
    backgroundColor: "#0D0E15",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B728E",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9EA2B6",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#161824",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#282A3A",
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9EA2B6",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
