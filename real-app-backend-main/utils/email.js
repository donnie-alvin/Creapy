const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

exports.sendEmail = async ({ to, subject, text, html }) => {
  const { AWS_REGION } = process.env;
  const from = process.env.EMAIL_FROM || "no-reply@localhost";

  if (!AWS_REGION) {
    // eslint-disable-next-line no-console
    console.log("[email:mock]", { to, subject, text, html });
    return { mocked: true };
  }

  const ses = new SESClient({ region: AWS_REGION });
  const body = {};

  if (text) {
    body.Text = { Data: text, Charset: "UTF-8" };
  }

  if (html) {
    body.Html = { Data: html, Charset: "UTF-8" };
  }

  return ses.send(
    new SendEmailCommand({
      Source: from,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: body,
      },
    })
  );
};
