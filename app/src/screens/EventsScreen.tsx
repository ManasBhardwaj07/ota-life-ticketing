import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Event } from "../types";
import { fetchApi, ApiError } from "../api/client";
import { QtyPicker } from "../components/QtyPicker";
import { ErrorView } from "../components/ErrorView";
import { EventCardSkeleton } from "../components/EventCardSkeleton";
import { colors, radius, spacing, typography, motion } from "../theme";

interface Props {
  onBookingSuccess?: () => void;
  activeUserId: number;
}

// Stale-While-Revalidate module-level cache (TTL 30s)
let eventsCache: { data: Event[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 30000;

export function EventsScreen({ onBookingSuccess, activeUserId }: Props) {
  const initialEvents = eventsCache ? eventsCache.data : [];
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [bookingEventId, setBookingEventId] = useState<number | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [banner, setBanner] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Banner slide-down animation
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBanner = (text: string, type: "success" | "error") => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setBanner({ text, type });
    bannerAnim.setValue(0);
    Animated.timing(bannerAnim, {
      toValue: 1,
      duration: motion.duration.banner,
      useNativeDriver: true,
    }).start();

    bannerTimerRef.current = setTimeout(() => {
      Animated.timing(bannerAnim, {
        toValue: 0,
        duration: motion.duration.banner,
        useNativeDriver: true,
      }).start(() => setBanner(null));
    }, motion.timing.bannerDismiss);
  };

  const loadEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (events.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await fetchApi<Event[]>("/events");
      eventsCache = { data, timestamp: Date.now() };
      setEvents(data);

      setQuantities((prev) => {
        const next: Record<number, number> = { ...prev };
        data.forEach((evt) => {
          if (!next[evt.id]) next[evt.id] = 1;
        });
        return next;
      });
    } catch (err: any) {
      const code = err instanceof ApiError ? err.code : undefined;
      const message = err.message || "Failed to load events";
      setError({ message, code });

      if (isRefresh) {
        showBanner(message, "error");
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
  }, [events.length]);

  useEffect(() => {
    // SWR: If cache exists and is fresh (< 30s), render immediately & refresh silently
    const isFresh = eventsCache && Date.now() - eventsCache.timestamp < CACHE_TTL_MS;
    if (isFresh) {
      setEvents(eventsCache!.data);
      setLoading(false);
      // Silent background validation
      loadEvents(false);
    } else {
      loadEvents(false);
    }
    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const handleQtyChange = (eventId: number, qty: number) => {
    setQuantities((prev) => ({ ...prev, [eventId]: qty }));
  };

  const handleBook = async (event: Event) => {
    const qty = quantities[event.id] || 1;
    setBookingEventId(event.id);

    try {
      const res = await fetchApi<{ tickets: any[] }>(`/events/${event.id}/book`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });

      const count = res.tickets?.length || qty;

      // Micro-optimism: local decrement of ticketsLeft ONLY AFTER 201 response arrives
      setEvents((prevEvents) =>
        prevEvents.map((e) =>
          e.id === event.id
            ? { ...e, ticketsLeft: Math.max(0, e.ticketsLeft - count) }
            : e
        )
      );

      showBanner(
        `Reserved ${count} ticket${count > 1 ? "s" : ""} successfully. Ready in My Tickets.`,
        "success"
      );

      // Background silent refetch to reconcile truthfully with database
      loadEvents(false);

      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Booking could not be completed";
      showBanner(msg, "error");
      Alert.alert(
        "Booking Error",
        msg,
        [{ text: "OK" }]
      );
      // Reconcile truthful stock on error
      loadEvents(false);
    } finally {
      setBookingEventId(null);
    }
  };

  if (loading && events.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.listContent}>
          <EventCardSkeleton />
        </View>
      </View>
    );
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
      {/* Animated Slide-down Notification Banner */}
      {banner && (
        <Animated.View
          style={[
            styles.bannerContainer,
            banner.type === "success" ? styles.bannerSuccess : styles.bannerError,
            {
              opacity: bannerAnim,
              transform: [
                {
                  translateY: bannerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              banner.type === "success" ? styles.bannerTextSuccess : styles.bannerTextError,
            ]}
          >
            {banner.type === "success" ? "CONFIRMED — " : "FAILED — "}
            {banner.text}
          </Text>
        </Animated.View>
      )}

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadEvents(true)}
            tintColor={colors.vermillion}
            colors={[colors.vermillion]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyLabel}>NO EVENTS AVAILABLE</Text>
            <Text style={styles.emptySubtext}>Check back soon for new fan fest dates.</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <EventCardItem
            item={item}
            index={index}
            isBooking={bookingEventId === item.id}
            selectedQty={quantities[item.id] || 1}
            onQtyChange={(q) => handleQtyChange(item.id, q)}
            onBook={() => handleBook(item)}
          />
        )}
      />
    </View>
  );
}

// Individual Event Card with entrance stagger, press-scale, and stock number animation
interface CardProps {
  item: Event;
  index: number;
  isBooking: boolean;
  selectedQty: number;
  onQtyChange: (qty: number) => void;
  onBook: () => void;
}

function EventCardItem({
  item,
  index,
  isBooking,
  selectedQty,
  onQtyChange,
  onBook,
}: CardProps) {
  const isSoldOut = item.ticketsLeft <= 0;
  const eventDate = new Date(item.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Entrance stagger animation (capped at 5 items)
  const entranceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const delay = Math.min(index, 4) * motion.delay.staggerPerItem;
    Animated.timing(entranceAnim, {
      toValue: 1,
      duration: motion.duration.stagger,
      delay,
      useNativeDriver: true,
    }).start();
  }, [entranceAnim, index]);

  // Stock change cross-fade animation
  const stockAnim = useRef(new Animated.Value(1)).current;
  const prevStockRef = useRef(item.ticketsLeft);
  useEffect(() => {
    if (prevStockRef.current !== item.ticketsLeft) {
      prevStockRef.current = item.ticketsLeft;
      Animated.sequence([
        Animated.timing(stockAnim, { toValue: 0.2, duration: motion.duration.crossFade / 2, useNativeDriver: true }),
        Animated.timing(stockAnim, { toValue: 1, duration: motion.duration.crossFade / 2, useNativeDriver: true }),
      ]).start();
    }
  }, [item.ticketsLeft, stockAnim]);

  // Button press scale feedback
  const buttonScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.timing(buttonScale, {
      toValue: motion.scale.press,
      duration: motion.duration.press,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.timing(buttonScale, {
      toValue: 1,
      duration: motion.duration.press,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.eventCard,
        {
          opacity: entranceAnim,
          transform: [
            {
              translateY: entranceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {/* Header Row: Stock badge + Price in ink */}
      <View style={styles.badgeRow}>
        {isSoldOut ? (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        ) : (
          <Animated.View style={[styles.stockBadge, { opacity: stockAnim }]}>
            <Text style={styles.stockText}>
              {item.ticketsLeft} TICKET{item.ticketsLeft > 1 ? "S" : ""} LEFT
            </Text>
          </Animated.View>
        )}

        {/* Price strictly in ink (vermillion reserved for actions) */}
        <Text style={styles.priceTag}>¥{Number(item.price).toLocaleString()}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{item.name}</Text>

      {/* Labeled Meta Rows (No emoji per G3) */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>VENUE</Text>
        <Text style={styles.metaValue}>{item.venue}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>DATE</Text>
        <Text style={styles.metaValue}>{formattedDate}</Text>
      </View>

      {/* Booking Controls */}
      {!isSoldOut && (
        <QtyPicker
          value={selectedQty}
          onChange={onQtyChange}
          max={Math.min(4, item.ticketsLeft)}
          disabled={isBooking}
        />
      )}

      {/* Book Button with press scale and in-flight spinner */}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={[
            styles.bookButton,
            isSoldOut && styles.bookButtonDisabled,
          ]}
          onPress={onBook}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isSoldOut || isBooking}
          activeOpacity={motion.opacity.press}
          accessibilityRole="button"
          accessibilityLabel={isSoldOut ? "Event sold out" : `Book ${selectedQty} tickets for ${item.name}`}
        >
          {isBooking ? (
            <View style={styles.buttonInnerRow}>
              <ActivityIndicator size="small" color={colors.card} style={styles.spinner} />
              <Text style={styles.bookButtonText}>RESERVING...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.bookButtonText,
                isSoldOut && styles.bookButtonTextDisabled,
              ]}
            >
              {isSoldOut
                ? "SOLD OUT"
                : `BOOK ${selectedQty} TICKET${selectedQty > 1 ? "S" : ""}`}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
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
  bannerContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: colors.matchaTint,
    borderColor: colors.matchaBorder,
  },
  bannerError: {
    backgroundColor: colors.errorTint,
    borderColor: colors.vermillionBorder,
  },
  bannerText: {
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
    textAlign: "center",
    letterSpacing: typography.tracking.wide,
  },
  bannerTextSuccess: {
    color: colors.matcha,
  },
  bannerTextError: {
    color: colors.vermillion,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  stockBadge: {
    backgroundColor: colors.vermillionTint,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.vermillionBorder,
  },
  stockText: {
    color: colors.vermillion,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
  soldOutBadge: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  soldOutText: {
    color: colors.inkSoft,
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.caps,
  },
  priceTag: {
    fontSize: typography.size.title,
    fontWeight: typography.weight.heavy,
    color: colors.ink,
  },
  title: {
    fontSize: typography.size.title + 2,
    fontWeight: typography.weight.heavy,
    color: colors.ink,
    marginBottom: spacing.sm,
    letterSpacing: typography.tracking.tight,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
  },
  metaLabel: {
    width: 55,
    fontSize: typography.size.micro,
    fontWeight: typography.weight.heavy,
    color: colors.inkSoft,
    letterSpacing: typography.tracking.caps,
  },
  metaValue: {
    flex: 1,
    fontSize: typography.size.body,
    fontWeight: typography.weight.medium,
    color: colors.ink,
  },
  bookButton: {
    backgroundColor: colors.vermillion,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  bookButtonDisabled: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginRight: spacing.sm,
  },
  bookButtonText: {
    color: colors.card,
    fontSize: typography.size.body,
    fontWeight: typography.weight.heavy,
    letterSpacing: typography.tracking.caps,
  },
  bookButtonTextDisabled: {
    color: colors.inkSoft,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyLabel: {
    color: colors.inkSoft,
    fontSize: typography.size.sub,
    fontWeight: typography.weight.bold,
    letterSpacing: typography.tracking.caps,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: colors.inkSoft,
    fontSize: typography.size.body,
  },
});
