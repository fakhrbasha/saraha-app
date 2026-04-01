export const templateEmail = (otp) => {
    return `
    <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Verification Code</title>
  </head>
  <body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#f4f4f4;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
      <tr>
        <td>
          <table align="center" width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; padding:20px;">
            
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0; color:#333;">Your Verification Code</h2>
              </td>
            </tr>

            <tr>
              <td style="color:#555; font-size:16px; line-height:1.5;">
                Hello,<br /><br />
                Use the following OTP code to complete your verification process:
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:25px 0;">
                <div style="font-size:32px; font-weight:bold; letter-spacing:5px; color:#000;">
                  Code : ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td style="color:#777; font-size:14px;">
                This code will expire in <strong>10 minutes</strong>.<br /><br />
                If you didn’t request this, please ignore this email.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:20px; font-size:12px; color:#aaa;">
                © 2026 Your Company. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};