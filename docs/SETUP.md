# BLUMO Setup Guide

## 1) Install
1. Zip and install theme from `wp-content/themes/blumo-studio`.
2. Zip and install plugin from `wp-content/plugins/blumo-portrait-engine`.
3. Activate WooCommerce + Elementor + theme + plugin.

## 2) Product configuration
1. Create product "Retrato Aquarela Personalizado".
2. In product edit screen, open **BLUMO Configurator Rules** metabox.
3. Keep default JSON or customize pricing and lead times.
4. Publish product.

## 3) Upload and consent
1. Product page includes mandatory upload and consent.
2. Set retention in **Settings > General > BLUMO retenção de uploads (dias)**.

## 4) Webhooks (n8n/Make/Zapier)
1. In **Settings > General > BLUMO Webhooks JSON**, add endpoints:
```json
{
  "order_created": "https://hooks.example/order",
  "photo_uploaded": "https://hooks.example/photo",
  "state_changed": "https://hooks.example/state",
  "approval_received": "https://hooks.example/approval"
}
```
2. Save settings.

## 5) Emails + workflow
1. Open any order and use **BLUMO Workflow** box.
2. Click states to send state emails and trigger automations.

## 6) End-to-end test checklist
- Customer configures size/people/background/add-ons.
- Live quote updates via REST.
- Customer uploads image and gives consent.
- Add to cart and checkout.
- Order stores upload, config JSON, and workflow state.
- Admin transitions state and customer receives email.
- Approval link works and stores decision.
- Webhook receiver gets payload.
