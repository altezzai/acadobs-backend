const { Op, where, DATEONLY } = require("sequelize");

const admin = require("../config/firebase");
const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided for notification.");
    return;
  }
  const stringData = {};
  for (const key in data) {
    stringData[key] =
      typeof data[key] === "string" ? data[key] : JSON.stringify(data[key]);
  }
  const message = {
    notification: { title, body },
    data: stringData,
    tokens,
  };
  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    // Print specific errors
    response.responses.forEach((r, i) => {
      if (!r.success) {
      }
    });

    return response;
  } catch (error) {
    logger.error("Error sending notification:", error);
    console.error("Error sending notification:", error);
  }
};

module.exports = {
  sendPushNotification,
};
