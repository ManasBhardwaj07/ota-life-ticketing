import express from "express";
import cors from "cors";
import eventsRouter from "./routes/events.js";
import ticketsRouter from "./routes/tickets.js";
import checkinsRouter from "./routes/checkins.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health route (P2 requirement)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Main routes
app.use("/events", eventsRouter);
app.use("/me/tickets", ticketsRouter);
app.use("/checkins", checkinsRouter);

// 404 handler
app.use(notFoundHandler);

// Central error handler
app.use(errorHandler);

export default app;
