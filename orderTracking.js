const logger = require("./logger");

/**
 * Order tracking namespace.
 * Clients join a room named after their orderId to receive live status updates.
 * Delivery partners emit GPS pings; the server fans them out to the relevant room.
 *
 * Events (client → server):
 *   join_order_room   { orderId }      — customer subscribes to an order's updates
 *   leave_order_room  { orderId }      — customer unsubscribes
 *   rider_location    { orderId, lat, lng, heading } — delivery partner GPS ping
 *
 * Events (server → client):
 *   order_status_update  { orderId, status, updatedAt }
 *   rider_location_update { lat, lng, heading }
 *   error                { message }
 */
const registerOrderTrackingSocket = (io) => {
  const orderNS = io.of("/orders");

  orderNS.on("connection", (socket) => {
    logger.info(`Socket connected [orders ns]: ${socket.id}`);

    // ── Customer joins an order room ────────────────────────────────────────
    socket.on("join_order_room", ({ orderId }) => {
      if (!orderId) {
        socket.emit("error", { message: "orderId is required to join a room." });
        return;
      }
      socket.join(orderId);
      logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    // ── Customer leaves an order room ───────────────────────────────────────
    socket.on("leave_order_room", ({ orderId }) => {
      socket.leave(orderId);
      logger.info(`Socket ${socket.id} left order room: ${orderId}`);
    });

    // ── Delivery partner pushes a GPS ping ──────────────────────────────────
    socket.on("rider_location", ({ orderId, lat, lng, heading }) => {
      if (!orderId || lat === undefined || lng === undefined) {
        socket.emit("error", { message: "orderId, lat, and lng are required." });
        return;
      }

      // Broadcast to all sockets in the order's room except the sender
      socket.to(orderId).emit("rider_location_update", {
        lat,
        lng,
        heading: heading || 0,
        timestamp: Date.now(),
      });
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected [orders ns]: ${socket.id} — ${reason}`);
    });
  });

  logger.info("Socket.io order tracking namespace registered at /orders");
};

/**
 * Utility: emit an order status update from a controller.
 * Usage:  emitOrderStatusUpdate(req.app.get("io"), orderId, status)
 */
const emitOrderStatusUpdate = (io, orderId, status) => {
  io.of("/orders")
    .to(orderId)
    .emit("order_status_update", { orderId, status, updatedAt: new Date().toISOString() });
};

module.exports = { registerOrderTrackingSocket, emitOrderStatusUpdate };
