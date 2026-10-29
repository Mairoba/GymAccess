import base64
import html
import io
import os
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from functools import wraps

import qrcode
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

# Set CORS_ALLOWED_ORIGINS to the deployed frontend origin(s), comma-separated.
# FRONTEND_URL is accepted as a fallback. If neither is set, allow local Vite ports
# for development only. Do not use wildcard origins with authenticated requests.
_origins_setting = (
    os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
    or os.getenv("FRONTEND_URL", "").strip()
)
if _origins_setting:
    ALLOWED_ORIGINS = [
        origin.strip().rstrip("/")
        for origin in _origins_setting.split(",")
        if origin.strip()
    ]
else:
    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ]

CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "OPTIONS"],
)


def normalize_supabase_url(value):
    """Accept the project URL, even if an old .env value ends in /rest/v1."""
    value = (value or "").strip().rstrip("/")
    value = re.sub(r"/rest/v1$", "", value, flags=re.IGNORECASE)
    value = re.sub(r"/auth/v1$", "", value, flags=re.IGNORECASE)
    return value


SUPABASE_URL = normalize_supabase_url(os.getenv("SUPABASE_URL"))
SUPABASE_PUBLISHABLE_KEY = (
    os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("SUPABASE_KEY") or ""
).strip()
RESEND_API_KEY = (os.getenv("RESEND_API_KEY") or "").strip()
RESEND_FROM_EMAIL = (
    os.getenv("RESEND_FROM_EMAIL") or "GymAccess <onboarding@resend.dev>"
).strip()
RESEND_TEST_MODE = os.getenv("RESEND_TEST_MODE", "true").strip().lower() == "true"
RESEND_TEST_TO = (os.getenv("RESEND_TEST_TO") or "").strip()


def supabase_headers(access_token):
    return {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }


def get_access_token():
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:].strip()
    return token or None


def supabase_get(table, params, access_token):
    """Read rows using the signed-in user's JWT so Supabase RLS stays in force."""
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise RuntimeError(
            "Supabase backend configuration is missing. Check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env."
        )
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table}",
        params=params,
        headers=supabase_headers(access_token),
        timeout=15,
    )
    if not response.ok:
        # Keep the provider response out of the browser; it may contain internals.
        raise RuntimeError(f"Could not read {table} from Supabase (HTTP {response.status_code}).")
    body = response.json()
    return body if isinstance(body, list) else []


def validate_supabase_user(access_token):
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        raise RuntimeError(
            "Supabase backend configuration is missing. Check SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env."
        )
    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers=supabase_headers(access_token),
        timeout=15,
    )
    if response.status_code in (401, 403):
        return None
    if not response.ok:
        raise RuntimeError(f"Supabase authentication check failed (HTTP {response.status_code}).")
    data = response.json()
    return data if isinstance(data, dict) and data.get("id") else None


def fmt_date(value):
    if not value:
        return "Not recorded"
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").strftime("%d %b %Y")
    except ValueError:
        return str(value)


def money_ngn(value):
    try:
        amount = Decimal(str(value or "0"))
    except (InvalidOperation, ValueError):
        amount = Decimal("0")
    return f"NGN {amount:,.2f}"


def fit_text(pdf_canvas, value, max_width, start_size=8, font="Helvetica-Bold"):
    value = str(value or "")
    size = start_size
    while size > 5 and pdf_canvas.stringWidth(value, font, size) > max_width:
        size -= 0.25
    pdf_canvas.setFont(font, size)
    return value


def build_membership_card_pdf(gym_name, member, membership, plan_name):
    """Create a compact printable card with the opaque UUID token as its QR value."""
    output = io.BytesIO()
    width, height = 85.6 * mm, 53.98 * mm
    pdf = canvas.Canvas(output, pagesize=(width, height))

    dark_green = colors.HexColor("#15251f")
    green = colors.HexColor("#00c88a")
    muted = colors.HexColor("#667085")

    pdf.setFillColor(colors.white)
    pdf.roundRect(0.7 * mm, 0.7 * mm, width - 1.4 * mm, height - 1.4 * mm, 3 * mm, fill=1, stroke=0)
    pdf.setFillColor(dark_green)
    pdf.roundRect(0.7 * mm, height - 18 * mm, width - 1.4 * mm, 17.3 * mm, 3 * mm, fill=1, stroke=0)
    pdf.rect(0.7 * mm, height - 18 * mm, width - 1.4 * mm, 3 * mm, fill=1, stroke=0)

    pdf.setFillColor(green)
    pdf.circle(8 * mm, height - 8.5 * mm, 3.2 * mm, fill=1, stroke=0)
    pdf.setFillColor(dark_green)
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawCentredString(8 * mm, height - 9.5 * mm, "GA")

    pdf.setFillColor(green)
    pdf.setFont("Helvetica-Bold", 6.5)
    pdf.drawString(13 * mm, height - 6.8 * mm, "GYMACCESS MEMBER")
    fit_text(pdf, gym_name, width - 43 * mm, 8.2)
    pdf.setFillColor(colors.white)
    pdf.drawString(13 * mm, height - 12.0 * mm, gym_name or "GymAccess Gym")

    qr_token = str(member.get("qr_token") or "").strip()
    qr = qrcode.QRCode(version=None, box_size=5, border=2)
    qr.add_data(qr_token)
    qr.make(fit=True)
    qr_image = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_buffer = io.BytesIO()
    qr_image.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    qr_size = 22 * mm
    qr_x, qr_y = width - qr_size - 5 * mm, 5 * mm
    pdf.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size, preserveAspectRatio=True, mask="auto")

    text_x = 5 * mm
    label_y = height - 25 * mm
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 6)
    pdf.drawString(text_x, label_y, "MEMBER NAME")
    pdf.setFillColor(dark_green)
    fit_text(pdf, member.get("full_name", "Member"), 48 * mm, 10)
    pdf.drawString(text_x, label_y - 5 * mm, str(member.get("full_name", "Member"))[:54])

    pdf.setFillColor(colors.HexColor("#087f5b"))
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawString(text_x, label_y - 10 * mm, str(member.get("member_number") or "—"))

    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 5.8)
    pdf.drawString(text_x, label_y - 15 * mm, f"PLAN  {str(plan_name or 'Membership')[:35]}")
    pdf.drawString(text_x, 5 * mm, f"VALID THROUGH  {fmt_date(membership.get('end_date'))}")
    pdf.setFillColor(colors.HexColor("#087f5b") if membership.get("status") == "active" else colors.HexColor("#b45309"))
    pdf.setFont("Helvetica-Bold", 6)
    pdf.drawString(text_x, 9 * mm, f"STATUS  {str(membership.get('status') or 'unknown').upper()}")

    pdf.showPage()
    pdf.save()
    output.seek(0)
    return output.getvalue()


def build_receipt_pdf(gym_name, member, payment, membership, plan_name):
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=22 * mm,
        leftMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"GymAccess receipt {payment.get('receipt_number') or ''}",
        author="GymAccess",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="GymAccessTitle", parent=styles["Title"], fontName="Helvetica-Bold",
        textColor=colors.HexColor("#15251f"), fontSize=21, leading=25, alignment=TA_LEFT,
        spaceAfter=5 * mm,
    ))
    styles.add(ParagraphStyle(
        name="GymAccessSubtitle", parent=styles["Normal"], textColor=colors.HexColor("#667085"),
        fontSize=9, leading=13, spaceAfter=8 * mm,
    ))
    styles.add(ParagraphStyle(
        name="SmallText", parent=styles["Normal"], fontSize=9, leading=13,
        textColor=colors.HexColor("#344054"),
    ))

    safe_gym = html.escape(str(gym_name or "GymAccess Gym"))
    safe_member = html.escape(str(member.get("full_name") or "Member"))
    safe_member_number = html.escape(str(member.get("member_number") or "—"))
    receipt_number = html.escape(str(payment.get("receipt_number") or "—"))
    amount = money_ngn(payment.get("amount"))
    confirmed_at = payment.get("confirmed_at") or payment.get("created_at") or "Not recorded"
    try:
        confirmed_at = datetime.fromisoformat(str(confirmed_at).replace("Z", "+00:00")).strftime("%d %b %Y, %H:%M UTC")
    except ValueError:
        confirmed_at = str(confirmed_at)

    story = [
        Paragraph("Payment receipt", styles["GymAccessTitle"]),
        Paragraph(f"{safe_gym}<br/>Thank you. This receipt confirms that the recorded payment was manually verified by authorised gym staff.", styles["GymAccessSubtitle"]),
    ]

    rows = [
        ["Receipt number", receipt_number],
        ["Member", f"{safe_member} ({safe_member_number})"],
        ["Membership", html.escape(str(plan_name or "Membership"))],
        ["Amount received", amount],
        ["Payment method", html.escape(str(payment.get("payment_method", "other")).replace("_", " ").title())],
        ["Payment status", "CONFIRMED"],
        ["Payment date", html.escape(confirmed_at)],
        ["Membership starts", fmt_date(membership.get("start_date"))],
        ["Valid through", fmt_date(membership.get("end_date"))],
    ]
    table = Table(rows, colWidths=[48 * mm, 105 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f2f4f7")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#475467")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#101828")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEADING", (0, 0), (-1, -1), 13),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#eaecf0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.extend([table, Spacer(1, 10 * mm), Paragraph(
        "Keep this receipt for your records. Membership validity is checked live by GymAccess when your QR card is scanned.",
        styles["SmallText"],
    )])
    doc.build(story)
    output.seek(0)
    return output.getvalue()


def encode_attachment(filename, content, content_type="application/pdf"):
    return {
        "filename": filename,
        "content": base64.b64encode(content).decode("ascii"),
        "content_type": content_type,
    }


@app.get("/")
def home():
    return jsonify({"app": "GymAccess API", "message": "Welcome to GymAccess", "status": "running"})


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "GymAccess API",
        "timestamp": datetime.now().astimezone().isoformat(),
        "email_provider_configured": bool(RESEND_API_KEY),
    })


@app.get("/api/dashboard")
def dashboard():
    # The live dashboard reads its tenant-scoped numbers from Supabase.
    # Keep this route for compatibility with the existing frontend.
    return jsonify({
        "total_members": 0,
        "active_memberships": 0,
        "today_check_ins": 0,
        "expiring_soon": 0,
        "message": "Dashboard API is ready",
    })


@app.post("/api/notifications/payment-receipt")
def email_payment_receipt():
    """Email the receipt PDF and QR membership card PDF for one confirmed payment.

    The request is authenticated with the current Supabase session's JWT. All
    Supabase reads use that same JWT, so existing tenant RLS policies apply.
    """
    access_token = get_access_token()
    if not access_token:
        return jsonify({"error": "You must be signed in to send a receipt email."}), 401

    body = request.get_json(silent=True) or {}
    payment_id = str(body.get("payment_id") or "").strip()
    if not payment_id or not re.fullmatch(r"[0-9a-fA-F-]{36}", payment_id):
        return jsonify({"error": "A valid payment ID is required."}), 400

    if not RESEND_API_KEY:
        return jsonify({
            "error": "Email is not configured yet. Add RESEND_API_KEY to backend/.env, then restart the Flask server."
        }), 503

    try:
        user = validate_supabase_user(access_token)
        if not user:
            return jsonify({"error": "Your session has expired. Please sign in again."}), 401

        profiles = supabase_get("user_profiles", {
            "select": "id,gym_id,role,is_active",
            "id": f"eq.{user['id']}",
            "is_active": "eq.true",
            "limit": "1",
        }, access_token)
        if not profiles:
            return jsonify({"error": "Your account is not linked to an active gym profile."}), 403
        profile = profiles[0]
        gym_id = profile.get("gym_id")
        if not gym_id:
            return jsonify({"error": "No gym is linked to your account."}), 403

        payments = supabase_get("payments", {
            "select": "id,gym_id,member_id,membership_id,amount,payment_method,status,external_reference,receipt_number,confirmed_at,created_at",
            "id": f"eq.{payment_id}",
            "gym_id": f"eq.{gym_id}",
            "status": "eq.confirmed",
            "limit": "1",
        }, access_token)
        if not payments:
            return jsonify({"error": "Only a confirmed payment from your own gym can be emailed."}), 404
        payment = payments[0]
        if not payment.get("receipt_number"):
            return jsonify({"error": "This confirmed payment has no receipt number. Refresh the Payments page and try again."}), 409

        members = supabase_get("members", {
            "select": "id,gym_id,member_number,full_name,email,phone,qr_token,status",
            "id": f"eq.{payment['member_id']}",
            "gym_id": f"eq.{gym_id}",
            "limit": "1",
        }, access_token)
        memberships = supabase_get("memberships", {
            "select": "id,gym_id,member_id,plan_id,start_date,end_date,status,created_at",
            "id": f"eq.{payment['membership_id']}",
            "gym_id": f"eq.{gym_id}",
            "limit": "1",
        }, access_token)
        gyms = supabase_get("gyms", {
            "select": "id,name,email,timezone",
            "id": f"eq.{gym_id}",
            "limit": "1",
        }, access_token)
        if not members or not memberships or not gyms:
            return jsonify({"error": "The payment, membership, member or gym details could not be found."}), 404

        member = members[0]
        membership = memberships[0]
        gym = gyms[0]
        member_email = (member.get("email") or "").strip()
        if not member_email:
            return jsonify({"error": "This member has no email address. Update their member record before emailing the receipt."}), 422
        if not member.get("qr_token"):
            return jsonify({"error": "This member has no QR token. Re-open the member record and check the QR setup."}), 409

        plans = supabase_get("membership_plans", {
            "select": "id,name,duration_days,price",
            "id": f"eq.{membership['plan_id']}",
            "gym_id": f"eq.{gym_id}",
            "limit": "1",
        }, access_token)
        plan_name = plans[0].get("name", "Membership") if plans else "Membership"
        gym_name = gym.get("name") or "GymAccess Gym"

        card_pdf = build_membership_card_pdf(gym_name, member, membership, plan_name)
        receipt_pdf = build_receipt_pdf(gym_name, member, payment, membership, plan_name)
        member_name_html = html.escape(str(member.get("full_name") or "Member"))
        gym_name_html = html.escape(gym_name)
        receipt_number_html = html.escape(str(payment.get("receipt_number") or "—"))
        email_html = f"""<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#15251f">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e4ebe6;border-radius:16px;overflow:hidden">
    <div style="background:#15251f;padding:24px;color:#ffffff"><div style="color:#6ee7b7;font-size:12px;font-weight:bold;letter-spacing:2px">GYMACCESS</div><h1 style="font-size:22px;margin:10px 0 0">Payment confirmed</h1></div>
    <div style="padding:26px"><p>Hello {member_name_html},</p><p>Your payment to <strong>{gym_name_html}</strong> has been confirmed. Your membership information is below.</p>
      <div style="padding:16px;background:#f5faf7;border-radius:12px;margin:20px 0"><div style="font-size:12px;color:#667085">RECEIPT NUMBER</div><div style="font-size:18px;font-weight:bold;margin:5px 0 12px">{receipt_number_html}</div><div style="font-size:14px;line-height:1.8"><strong>Membership:</strong> {html.escape(str(plan_name))}<br><strong>Amount received:</strong> {html.escape(money_ngn(payment.get('amount')))}<br><strong>Valid from:</strong> {html.escape(fmt_date(membership.get('start_date')))}<br><strong>Valid through:</strong> {html.escape(fmt_date(membership.get('end_date')))}</div></div>
      <p>Attached are your payment receipt and printable membership card. The membership card includes your personal QR code. Present it at reception when checking in.</p><p style="font-size:12px;color:#667085;margin-top:28px">This is an automated message from {gym_name_html}. Contact your gym directly if any detail is incorrect.</p>
    </div></div>
</body></html>"""
        email_text = (
            f"Hello {member.get('full_name') or 'Member'},\n\n"
            f"Your payment to {gym_name} has been confirmed.\n"
            f"Receipt: {payment.get('receipt_number')}\n"
            f"Membership: {plan_name}\n"
            f"Amount received: {money_ngn(payment.get('amount'))}\n"
            f"Valid from: {fmt_date(membership.get('start_date'))}\n"
            f"Valid through: {fmt_date(membership.get('end_date'))}\n\n"
            "Your payment receipt and printable QR membership card are attached."
        )
        member_no_file = re.sub(r"[^A-Za-z0-9_-]", "_", str(member.get("member_number") or "member"))
        receipt_no_file = re.sub(r"[^A-Za-z0-9_-]", "_", str(payment.get("receipt_number") or "receipt"))
        if RESEND_TEST_MODE and not RESEND_TEST_TO:
            return jsonify({
                "error": "Email test mode is enabled. Add RESEND_TEST_TO to backend/.env using the email address permitted by your Resend account, then restart Flask."
            }), 503

        recipient_email = RESEND_TEST_TO if RESEND_TEST_MODE else member_email
        if RESEND_TEST_MODE:
            email_html = email_html.replace(
                '<div style="padding:26px">',
                '<div style="padding:12px 26px;background:#fff7ed;color:#9a3412;font-size:12px">TEST MODE: this message is sent to the configured developer test inbox, not the member email address.</div><div style="padding:26px">',
                1,
            )
            email_text = (
                "TEST MODE: this message was sent to the configured developer test inbox, not to the member email address.\n\n"
                + email_text
            )

        payload = {
            "from": RESEND_FROM_EMAIL,
            "to": [recipient_email],
            "subject": f"{gym_name} membership card and payment receipt",
            "html": email_html,
            "text": email_text,
            "attachments": [
                encode_attachment(f"GymAccess_Membership_Card_{member_no_file}.pdf", card_pdf),
                encode_attachment(f"GymAccess_Receipt_{receipt_no_file}.pdf", receipt_pdf),
            ],
        }
        provider_response = requests.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=25,
        )
        try:
            provider_body = provider_response.json()
        except ValueError:
            provider_body = {}
        if not provider_response.ok:
            provider_message = provider_body.get("message") or provider_body.get("error") or "Email provider rejected the message."
            app.logger.warning("Resend rejected a GymAccess receipt email (HTTP %s): %s", provider_response.status_code, provider_message)
            if provider_response.status_code in (401, 403):
                return jsonify({"error": "Resend rejected the API key or sender. Check RESEND_API_KEY and RESEND_FROM_EMAIL."}), 502
            if provider_response.status_code == 422:
                return jsonify({"error": "Resend could not send to this recipient or sender. In test mode, send to the email address verified in your Resend account; verify a domain before emailing customers."}), 502
            return jsonify({"error": "The email provider could not send the message. Check your Resend dashboard for the reason."}), 502

        return jsonify({
            "success": True,
            "message": "Membership card and payment receipt emailed successfully.",
            "to": recipient_email,
            "intended_to": member_email,
            "test_mode": RESEND_TEST_MODE,
            "message": (
                f"Test email sent to {recipient_email}; the member was not emailed."
                if RESEND_TEST_MODE
                else f"Membership card and payment receipt emailed to {recipient_email}."
            ),
            "provider_message_id": provider_body.get("id"),
            "receipt_number": payment.get("receipt_number"),
        }), 200

    except requests.RequestException as error:
        app.logger.exception("GymAccess email delivery request failed: %s", error)
        return jsonify({"error": "Could not reach Supabase or the email provider. Check your internet connection and backend logs."}), 502
    except RuntimeError as error:
        app.logger.warning("GymAccess email delivery configuration/data issue: %s", error)
        return jsonify({"error": str(error)}), 502
    except Exception:
        app.logger.exception("Unexpected GymAccess receipt email error")
        return jsonify({"error": "Unexpected email error. Check the Flask terminal for details."}), 500


if __name__ == "__main__":
    # Render and similar hosts inject PORT and require binding to all interfaces.
    # Production should be started with Gunicorn (gunicorn app:app), not Flask's dev server.
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", "5001")),
        debug=os.getenv("FLASK_DEBUG", "false").strip().lower() == "true",
    )
