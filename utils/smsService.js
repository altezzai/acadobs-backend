const logger = require("./logger");

/**
 * Convert duration (milliseconds or minutes) to minutes
 * @param {number} ttl - TTL in milliseconds or minutes
 * @returns {number} TTL in minutes
 */
const msToMinutes = (ttl) => {
  if (!ttl) return 5;
  // If already in minutes (e.g. <= 60), return as-is
  if (ttl <= 60) return Math.round(ttl);
  // Otherwise assume milliseconds and convert to minutes
  return Math.round(ttl / (60 * 1000));
};

/**
 * Format mobile number for MSG91 (e.g. add 91 prefix for 10-digit Indian numbers)
 * @param {string|number} mobile
 * @returns {string}
 */
const formatMobileNumber = (mobile) => {
  if (!mobile) return "";
  let cleaned = mobile.toString().trim().replace(/[\s+-]/g, "");
  // If standard 10-digit Indian mobile number, prefix with country code 91
  if (/^\d{10}$/.test(cleaned)) {
    return `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Send SMS OTP using MSG91 API v5
 * @param {string} to - Recipient mobile number
 * @param {string} otp - Generated OTP code
 * @param {number} ttl - Time-to-live in ms or minutes (default 5 minutes)
 * @param {string} templateId - MSG91 template ID
 * @returns {Promise<void>}
 */
const sendOTPWithMsg91 = async (
  to,
  otp,
  ttl = 300000,
  templateId = process.env.MSG91_OTP_TEMPLATE_ID
) => {
  const msg91AuthKey = process.env.MSG91_AUTHKEY;
  const targetTemplateId =
    templateId || process.env.MSG91_OTP_TEMPLATE_ID;

  if (!msg91AuthKey || !targetTemplateId) {
    throw new Error(
      "MSG91 is not configured. Check MSG91_AUTHKEY and MSG91_OTP_TEMPLATE_ID."
    );
  }
  const formattedMobile = formatMobileNumber(to);

  if (!formattedMobile) {
    throw new Error("Invalid mobile number.");
  }

  const ttlInMinutes = Math.ceil(ttl / 60000);

  const url = new URL("https://control.msg91.com/api/v5/otp");

  url.searchParams.set("template_id", targetTemplateId);
  url.searchParams.set("mobile", formattedMobile);
  url.searchParams.set("authkey", msg91AuthKey);

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        OTP: String(otp),
        OTP_EXPIRY: String(ttlInMinutes),
      }),
    });

    const responseText = await res.text();

    logger.info(
      `MSG91 OTP API response: status=${res.status}, response=${responseText}`
    );

    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    // Handle HTTP errors
    if (!res.ok) {
      logger.error(
        `MSG91 request failed. HTTP status: ${res.status}`
      );

      throw new Error(
        `MSG91 API request failed with HTTP status ${res.status}.`
      );
    }

    const apiType = String(responseData?.type || "").toLowerCase();

    if (
      apiType === "error" ||
      responseData?.success === false
    ) {
      logger.error(
        `MSG91 rejected the OTP request: ${JSON.stringify(responseData)}`
      );

      throw new Error(
        responseData?.message || "MSG91 rejected the OTP request."
      );
    }

    logger.info(
      `MSG91 accepted the OTP request for the configured recipient.`
    );

    return responseData;
  } catch (error) {
    logger.error(`MSG91 OTP sending failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sendOTPWithMsg91,
  msToMinutes,
  formatMobileNumber,
};
