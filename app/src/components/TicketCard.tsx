import React from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ticket } from "../types";

interface Props {
  ticket: Ticket;
}

export function TicketCard({ ticket }: Props) {
  const isCheckedIn = ticket.checkedInAt !== null;
  const eventDate = new Date(ticket.event.date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = eventDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const checkedInFormatted = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <View style={[styles.card, isCheckedIn && styles.cardCheckedIn]}>
      {/* Status Banner */}
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          {isCheckedIn ? (
            <View style={styles.badgeCheckedIn}>
              <Text style={styles.badgeCheckedInText}>✓ CHECKED IN</Text>
            </View>
          ) : (
            <View style={styles.badgeValid}>
              <Text style={styles.badgeValidText}>● ADMIT ONE</Text>
            </View>
          )}
        </View>

        <Text style={styles.codeText}>#{ticket.code}</Text>
      </View>

      {/* Event Details */}
      <View style={styles.body}>
        <Text style={styles.eventName}>{ticket.event.name}</Text>
        <Text style={styles.venueText}>📍 {ticket.event.venue}</Text>

        <View style={styles.timeRow}>
          <Text style={styles.dateTimeText}>📅 {formattedDate}</Text>
          <Text style={styles.dateTimeText}>⏰ {formattedTime}</Text>
        </View>

        {isCheckedIn && checkedInFormatted ? (
          <View style={styles.timestampBox}>
            <Text style={styles.timestampLabel}>Scanned at Gate:</Text>
            <Text style={styles.timestampValue}>{checkedInFormatted}</Text>
          </View>
        ) : null}
      </View>

      {/* Perforated Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.leftCutout} />
        <View style={styles.dashedLine} />
        <View style={styles.rightCutout} />
      </View>

      {/* QR Code Section */}
      <View style={styles.qrSection}>
        <View style={[styles.qrWrapper, isCheckedIn && styles.qrWrapperDim]}>
          <QRCode
            value={ticket.code}
            size={160}
            color="#000000"
            backgroundColor="#FFFFFF"
          />
        </View>
        <Text style={styles.qrCaption}>
          {isCheckedIn ? "TICKET USED • ENTRY COMPLETED" : "PRESENT AT GATE FOR SCAN"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#161824",
    borderRadius: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#282A3A",
    overflow: "hidden",
  },
  cardCheckedIn: {
    opacity: 0.85,
    borderColor: "#203A2E",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  badgeContainer: {},
  badgeValid: {
    backgroundColor: "rgba(0, 230, 153, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 230, 153, 0.3)",
  },
  badgeValidText: {
    color: "#00E699",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  badgeCheckedIn: {
    backgroundColor: "rgba(255, 180, 0, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 180, 0, 0.4)",
  },
  badgeCheckedInText: {
    color: "#FFB400",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  codeText: {
    fontFamily: "monospace",
    color: "#6B728E",
    fontSize: 13,
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  venueText: {
    fontSize: 14,
    color: "#9EA2B6",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  dateTimeText: {
    fontSize: 13,
    color: "#CBD0E0",
    fontWeight: "500",
  },
  timestampBox: {
    marginTop: 12,
    backgroundColor: "rgba(255, 180, 0, 0.08)",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 180, 0, 0.2)",
  },
  timestampLabel: {
    fontSize: 11,
    color: "#FFB400",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timestampValue: {
    fontSize: 13,
    fontFamily: "monospace",
    color: "#FFFFFF",
    marginTop: 2,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    position: "relative",
  },
  leftCutout: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0D0E15",
    marginLeft: -12,
  },
  rightCutout: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0D0E15",
    marginRight: -12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#282A3A",
  },
  qrSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#12141F",
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  qrWrapperDim: {
    opacity: 0.5,
  },
  qrCaption: {
    marginTop: 14,
    fontSize: 11,
    fontWeight: "700",
    color: "#6B728E",
    letterSpacing: 1,
  },
});
