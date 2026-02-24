import { resend, FROM_EMAIL } from "./resend";

const BRAND = "YDDISH MARKET";
const SITE_URL = "https://yddishmarket.com";

/* ── Shared email styles ── */
const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #222222;
  line-height: 1.6;
`;

const buttonStyle = `
  display: inline-block;
  padding: 14px 32px;
  background: linear-gradient(to bottom, #2C2C2C, #1A1A1A);
  color: #FFFFFF;
  text-decoration: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

function emailLayout(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
    <body style="margin:0;padding:0;background:#FAFAF7;${baseStyles}">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <a href="${SITE_URL}" style="text-decoration:none;color:#222222;font-size:18px;font-weight:700;letter-spacing:2px;">
            ${BRAND}
          </a>
        </div>
        <!-- Content -->
        <div style="background:#FFFFFF;border:1px solid #EBEBEB;border-radius:16px;padding:32px;margin-bottom:32px;">
          ${content}
        </div>
        <!-- Footer -->
        <div style="text-align:center;font-size:11px;color:#999999;line-height:1.8;">
          <p style="margin:0;">© ${new Date().getFullYear()} ${BRAND} — <a href="${SITE_URL}" style="color:#C5A55A;text-decoration:none;">yddishmarket.com</a></p>
          <p style="margin:4px 0 0;">EINSOF SAS · Judaica & Culture juive</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatPriceEmail(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents);
}

/* ── Order confirmation email ── */

type OrderConfirmationData = {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  orderId: string;
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    sellerName: string;
    variantName?: string | null;
  }[];
  subtotal: number;
  shippingTotal: number;
  total: number;
  address: {
    firstName: string;
    lastName: string;
    street: string;
    street2?: string | null;
    city: string;
    zip: string;
    country: string;
  };
};

export async function sendOrderConfirmationEmail(data: OrderConfirmationData) {
  try {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #F0F0F0;">
            <div style="font-size:13px;font-weight:500;color:#222222;">${item.title}</div>
            ${item.variantName ? `<div style="font-size:11px;color:#888;">${item.variantName}</div>` : ""}
            <div style="font-size:11px;color:#888;">${item.sellerName} · Qté : ${item.quantity}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #F0F0F0;text-align:right;font-size:13px;white-space:nowrap;">
            ${formatPriceEmail(item.subtotal)}
          </td>
        </tr>
      `
      )
      .join("");

    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:56px;height:56px;background:#222222;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:24px;">✓</span>
        </div>
        <h1 style="margin:0;font-size:20px;font-weight:300;color:#222222;">Merci pour votre commande !</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#888888;">Commande n° ${data.orderNumber}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px 0;border-bottom:2px solid #222;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Article</th>
            <th style="text-align:right;padding:8px 0;border-bottom:2px solid #222;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Prix</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span style="color:#888;">Sous-total</span>
          <span>${formatPriceEmail(data.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;">
          <span style="color:#888;">Livraison</span>
          <span>${data.shippingTotal === 0 ? "Offerte" : formatPriceEmail(data.shippingTotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:15px;font-weight:600;border-top:2px solid #222;margin-top:8px;">
          <span>Total</span>
          <span>${formatPriceEmail(data.total)}</span>
        </div>
      </div>

      <div style="background:#FAFAF7;border-radius:12px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#888;">Adresse de livraison</p>
        <p style="margin:0;font-size:13px;color:#222;">
          ${data.address.firstName} ${data.address.lastName}<br/>
          ${data.address.street}${data.address.street2 ? `<br/>${data.address.street2}` : ""}<br/>
          ${data.address.zip} ${data.address.city}, ${data.address.country}
        </p>
      </div>

      <div style="text-align:center;">
        <a href="${SITE_URL}/account/orders" style="${buttonStyle}">
          Suivre ma commande
        </a>
      </div>

      <p style="text-align:center;font-size:12px;color:#888888;margin-top:20px;">
        Chaque vendeur préparera et expédiera sa partie de la commande séparément.
      </p>
    `;

    await resend.emails.send({
      from: `${BRAND} <${FROM_EMAIL}>`,
      to: data.buyerEmail,
      subject: `Commande ${data.orderNumber} confirmée — ${BRAND}`,
      html: emailLayout(content),
    });

    console.log(`[EMAIL] Order confirmation sent to ${data.buyerEmail}`);
  } catch (error) {
    console.error("[EMAIL_ORDER_CONFIRMATION]", error);
    // Don't throw — email failure shouldn't break the order flow
  }
}

/* ── Shipping notification email ── */

type ShippingNotificationData = {
  buyerEmail: string;
  buyerName: string;
  orderNumber: string;
  sellerName: string;
  productTitle: string;
  carrier: string | null;
  trackingUrl: string | null;
  trackingNumber: string | null;
};

export async function sendShippingNotificationEmail(data: ShippingNotificationData) {
  try {
    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:56px;height:56px;background:#222222;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:24px;">📦</span>
        </div>
        <h1 style="margin:0;font-size:20px;font-weight:300;color:#222222;">Votre colis est en route !</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#888888;">Commande n° ${data.orderNumber}</p>
      </div>

      <div style="background:#FAFAF7;border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:500;color:#222222;">${data.productTitle}</p>
        <p style="margin:0;font-size:12px;color:#888888;">Expédié par ${data.sellerName}</p>
        ${data.carrier ? `<p style="margin:8px 0 0;font-size:12px;color:#888;">Transporteur : ${data.carrier}</p>` : ""}
        ${data.trackingNumber ? `<p style="margin:4px 0 0;font-size:12px;color:#888;">N° de suivi : ${data.trackingNumber}</p>` : ""}
      </div>

      <div style="text-align:center;">
        ${
          data.trackingUrl
            ? `<a href="${data.trackingUrl}" style="${buttonStyle}">Suivre mon colis</a>`
            : `<a href="${SITE_URL}/account/orders" style="${buttonStyle}">Voir ma commande</a>`
        }
      </div>
    `;

    await resend.emails.send({
      from: `${BRAND} <${FROM_EMAIL}>`,
      to: data.buyerEmail,
      subject: `Votre colis est en route ! — ${BRAND}`,
      html: emailLayout(content),
    });

    console.log(`[EMAIL] Shipping notification sent to ${data.buyerEmail}`);
  } catch (error) {
    console.error("[EMAIL_SHIPPING_NOTIFICATION]", error);
  }
}

/* ── New order notification for sellers ── */

type SellerNewOrderData = {
  sellerEmail: string;
  sellerName: string;
  orderNumber: string;
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
    variantName?: string | null;
  }[];
  buyerCity: string;
};

export async function sendSellerNewOrderEmail(data: SellerNewOrderData) {
  try {
    const itemsHtml = data.items
      .map(
        (item) => `
        <div style="padding:12px 0;border-bottom:1px solid #F0F0F0;font-size:13px;">
          <strong>${item.title}</strong>
          ${item.variantName ? ` — ${item.variantName}` : ""}
          · Qté : ${item.quantity} · ${formatPriceEmail(item.unitPrice)}
        </div>
      `
      )
      .join("");

    const content = `
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;font-weight:300;color:#222222;">Nouvelle commande !</h1>
        <p style="margin:8px 0 0;font-size:13px;color:#888888;">Commande n° ${data.orderNumber}</p>
      </div>

      <p style="font-size:13px;color:#222222;">
        Bonjour ${data.sellerName}, vous avez reçu une nouvelle commande à expédier vers ${data.buyerCity}.
      </p>

      ${itemsHtml}

      <div style="text-align:center;margin-top:24px;">
        <a href="${SITE_URL}/dashboard/orders" style="${buttonStyle}">
          Voir dans mon espace vendeur
        </a>
      </div>
    `;

    await resend.emails.send({
      from: `${BRAND} <${FROM_EMAIL}>`,
      to: data.sellerEmail,
      subject: `Nouvelle commande ${data.orderNumber} — ${BRAND}`,
      html: emailLayout(content),
    });

    console.log(`[EMAIL] New order notification sent to ${data.sellerEmail}`);
  } catch (error) {
    console.error("[EMAIL_SELLER_NEW_ORDER]", error);
  }
}
