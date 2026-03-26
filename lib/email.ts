import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "MedMarket <onboarding@resend.dev>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Order placed ─────────────────────────────────────────────────────────────

interface OrderNotificationParams {
  sellerEmail: string;
  sellerName: string | null;
  buyerHospitalName: string;
  listingTitle: string;
  medicineName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  currency: string;
}

export async function sendOrderNotification(params: OrderNotificationParams) {
  const {
    sellerEmail, sellerName, buyerHospitalName,
    listingTitle, medicineName, quantity, unit, totalPrice, currency,
  } = params;

  const total = new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(totalPrice);
  const link = `${BASE_URL}/en/my-listings`;

  try {
    await resend.emails.send({
      from: FROM,
      to: sellerEmail,
      subject: `New order for "${listingTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#1a56db">New order received</h2>
          <p>Hi ${sellerName ?? "there"},</p>
          <p>
            <strong>${buyerHospitalName}</strong> has placed an order on your listing
            <strong>${listingTitle}</strong> (${medicineName}).
          </p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#555">Quantity</td>
              <td style="padding:6px 0"><strong>${quantity} ${unit}</strong></td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#555">Total</td>
              <td style="padding:6px 0"><strong>${total}</strong></td>
            </tr>
          </table>
          <a href="${link}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            View in My Listings →
          </a>
          <p style="margin-top:24px;font-size:12px;color:#888">MedMarket — B2B medicine exchange for hospitals</p>
        </div>
      `,
    });
  } catch (err) {
    // Fire-and-forget — log but never block the order
    console.error("[email] sendOrderNotification failed:", err);
  }
}

// ─── Staff invitation ─────────────────────────────────────────────────────────

interface InvitationEmailParams {
  recipientEmail: string;
  hospitalName: string;
  inviterName: string | null;
  token: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams) {
  const { recipientEmail, hospitalName, inviterName, token } = params;
  const link = `${BASE_URL}/en/register?token=${token}`;

  try {
    await resend.emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `You've been invited to join ${hospitalName} on MedMarket`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#1a56db">You're invited to MedMarket</h2>
          <p>
            ${inviterName ? `<strong>${inviterName}</strong> has` : "Someone has"} invited you to join
            <strong>${hospitalName}</strong> on MedMarket, the B2B medicine exchange platform for hospitals.
          </p>
          <p>Click the link below to create your account. This invitation expires in 7 days.</p>
          <a href="${link}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Accept invitation →
          </a>
          <p style="margin-top:24px;font-size:12px;color:#888">
            If you weren't expecting this, you can safely ignore this email.
          </p>
          <p style="font-size:12px;color:#888">MedMarket — B2B medicine exchange for hospitals</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendInvitationEmail failed:", err);
  }
}

// ─── New chat message ─────────────────────────────────────────────────────────

interface MessageNotificationParams {
  recipientEmail: string;
  recipientName: string | null;
  senderName: string | null;
  senderHospital: string | null;
  listingTitle: string;
  messagePreview: string;
  conversationId: string;
}

export async function sendMessageNotification(params: MessageNotificationParams) {
  const {
    recipientEmail, recipientName, senderName, senderHospital,
    listingTitle, messagePreview, conversationId,
  } = params;

  const link = `${BASE_URL}/en/conversations/${conversationId}`;
  const preview = messagePreview.length > 200 ? messagePreview.slice(0, 200) + "…" : messagePreview;

  try {
    await resend.emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `New message about "${listingTitle}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#111">
          <h2 style="color:#1a56db">New message</h2>
          <p>Hi ${recipientName ?? "there"},</p>
          <p>
            <strong>${senderName ?? "Someone"}${senderHospital ? ` (${senderHospital})` : ""}</strong>
            sent you a message about <strong>${listingTitle}</strong>:
          </p>
          <blockquote style="border-left:3px solid #1a56db;margin:16px 0;padding:10px 16px;background:#f0f4ff;border-radius:0 8px 8px 0;color:#333">
            ${preview}
          </blockquote>
          <a href="${link}" style="display:inline-block;background:#1a56db;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Reply →
          </a>
          <p style="margin-top:16px;font-size:12px;color:#888">
            You can turn off message email notifications in your
            <a href="${BASE_URL}/en/profile" style="color:#1a56db">profile settings</a>.
          </p>
          <p style="font-size:12px;color:#888">MedMarket — B2B medicine exchange for hospitals</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] sendMessageNotification failed:", err);
  }
}
