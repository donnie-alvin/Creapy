const africastalking = require("africastalking");

exports.sendSms = async ({ to, message }) => {
  const { AT_API_KEY, AT_USERNAME, AT_SENDER_ID } = process.env;

  if (!AT_API_KEY) {
    // eslint-disable-next-line no-console
    console.log("[sms:mock]", { to, message });
    return { mocked: true };
  }

  const at = africastalking({
    apiKey: AT_API_KEY,
    username: AT_USERNAME,
  });
  const sms = at.SMS;

  return sms.send({
    to: [to],
    message,
    from: AT_SENDER_ID || undefined,
  });
};
