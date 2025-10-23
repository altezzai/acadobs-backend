const { Op, where, DATEONLY } = require("sequelize");

const admin = require("../config/firebase");
const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) {
    console.log("No tokens provided for notification.");
    return;
  }
  const message = {
    notification: {
      title: title,
      body: body,
    },
    data: data,
    tokens: tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
module.exports = {
  sendPushNotification,
};
