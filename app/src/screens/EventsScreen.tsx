import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Event } from "../types";
import { fetchApi, ApiError } from "../api/client";
import { QtyPicker } from "../components/QtyPicker";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";

interface Props {
  onBookingSuccess?: () => void;
  activeUserId: number;
}

export function EventsScreen({ onBookingSuccess, activeUserId }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [bookingEventId, setBookingEventId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchApi<Event[]>("/events");
      setEvents(data);
      // Initialize default quantities
      const initialQtys: Record<number, number> = {};
      data.forEach((evt) => {
        initialQtys[evt.id] = 1;
      });
      setQuantities((prev) => ({ ...initialQtys, ...prev }));
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError({ message: err.message, code: err.code });
      } else {
        setError({ message: err.message || "Failed to load events" });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleQtyChange = (eventId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [eventId]: qty }));
  };

  const handleBook = async (event: Event) => {
    const qty = quantities[event.id] || 1;
    setBookingEventId(event.id);
    setBannerMessage(null);

    try {
      const res = await fetchApi<{ tickets: any[] }>(`/events/${event.id}/book`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });

      const count = res.tickets?.length || qty;
      setBannerMessage({
        type: "success",
        text: `Successfully booked ${count} ticket${count > 1 ? "s" : ""}! View in "My Tickets" tab.`,
      });

      // Refresh events inventory
      await loadEvents(true);

      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Booking could not be completed";
      setBannerMessage({
        type: "error",
        text: msg,
      });
      // Refresh to reflect truthfully updated inventory
      await loadEvents(true);
    } finally {
      setBookingEventId(null);
    }
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading available events..." />;
  }

  if (error && events.length === 0) {
    return (
      <ErrorView
        title="Could not load events"
        message={error.message}
        code={error.code}
        onRetry={() => loadEvents()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {bannerMessage && (
        <View
          style={[
            styles.banner,
            bannerMessage.type === "success" ? styles.bannerSuccess : styles.bannerError,
          ]}
        >
          <Text style={styles.bannerText}>
            {bannerMessage.type === "success" ? "✓ " : "✕ "}
            {bannerMessage.text}
          </Text>
        </View>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(true)}
            tintColor="#FF3366"
            colors={["#FF3366"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming events found.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSoldOut = item.ticketsLeft <= 0;
          const isBookingThis = bookingEventId === item.id;
          const selectedQty = quantities[item.id] || 1;
          const eventDate = new Date(item.date);

          return (
            <View style={styles.eventCard}>
              {/* Header Badges */}
              <View style={styles.badgeRow}>
                {isSoldOut ? (
                  <View style={styles.soldOutBadge}>
                    <Text style={styles.soldOutText}>● SOLD OUT</Text>
                  </View>
                ) : (
                  <View style={styles.stockBadge}>
                    <Text style={styles.stockText}>
                      🔥 {item.ticketsLeft} TICKET{item.ticketsLeft > 1 ? "S" : ""} LEFT
                    </Text>
                  </View>
                )}
                <Text style={styles.priceTag}>¥{Number(item.price).toLocaleString()}</Text>
              </View>

              {/* Title & Info */}
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.venue}>📍 {item.venue}</Text>
              <Text style={styles.date}>
                🗓️ {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </Text>

              {/* Booking Controls */}
              {!isSoldOut && (
                <QtyPicker
                  value={selectedQty}
                  onChange={(q) => handleQtyChange(item.id, q)}
                  max={Math.min(4, item.ticketsLeft)}
                  disabled={isBookingThis}
                />
              )}

              {/* Book Button */}
              <TouchableOpacity
                style={[
                  styles.bookButton,
                  isSoldOut && styles.bookButtonDisabled,
                  isBookingThis && styles.bookButtonInFlight,
                ]}
                onPress={() => handleBook(item)}
                disabled={isSoldOut || isBookingThis}
                activeOpacity={0.8}
              >
                <Text style={styles.bookButtonText}>
                  {isBookingThis
                    ? "RESERVING..."
                    : isSoldOut
                    ? "SOLD OUT"
                    : `BOOK ${selectedQty} TICKET${selectedQty > 1 ? "S" : ""}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
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
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  bannerSuccess: {
    backgroundColor: "rgba(0, 230, 153, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 230, 153, 0.4)",
  },
  bannerError: {
    backgroundColor: "rgba(255, 75, 75, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 75, 75, 0.4)",
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  eventCard: {
    backgroundColor: "#161824",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#26293A",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stockBadge: {
    backgroundColor: "rgba(255, 51, 102, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 51, 102, 0.3)",
  },
  stockText: {
    color: "#FF3366",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  soldOutBadge: {
    backgroundColor: "rgba(107, 114, 142, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(107, 114, 142, 0.3)",
  },
  soldOutText: {
    color: "#8B92AB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  priceTag: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00E699",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  venue: {
    fontSize: 14,
    color: "#9EA2B6",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: "#6B728E",
    marginBottom: 8,
  },
  bookButton: {
    backgroundColor: "#FF3366",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  bookButtonDisabled: {
    backgroundColor: "#222533",
  },
  bookButtonInFlight: {
    opacity: 0.7,
  },
  bookButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#6B728E",
    fontSize: 15,
  },
});
