# BLUMO Portrait Platform

## Project structure

```text
wp-content/
  themes/blumo-studio/
    style.css
    functions.php
    assets/css/{tokens.css,theme.css}
    assets/js/theme-ui.js
  plugins/blumo-portrait-engine/
    blumo-portrait-engine.php
    includes/
      class-bpe-configurator.php
      class-bpe-upload-manager.php
      class-bpe-workflow.php
      class-bpe-webhooks.php
      class-bpe-analytics.php
    assets/js/configurator-ui.js
    assets/css/product-ui.css
docs/SETUP.md
elementor-templates/home-template.json
```

## Elementor page blueprint
- Home: Hero reveal, trust badges row, sizing selector section, 3-step flow, social proof cards, FAQ accordion.
- Product: Woo single product with embedded BLUMO configurator and upload module.
- Upload Guide: Toggle cards for good vs poor photo examples.
- Order Tracking: Elementor section showing workflow timeline from order meta.
- Thank You: next steps + support contact.
