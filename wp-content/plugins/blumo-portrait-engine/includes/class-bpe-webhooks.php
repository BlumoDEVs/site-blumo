<?php

if (! defined('ABSPATH')) {
    exit;
}

class BPE_Webhooks {
    private string $option_key = 'bpe_webhook_endpoints';

    public function __construct() {
        add_action('woocommerce_checkout_order_processed', fn ($order_id) => $this->send('order_created', wc_get_order($order_id)));
        add_action('bpe_workflow_state_changed', fn (WC_Order $order, string $state) => $this->send('state_changed', $order, ['state' => $state]), 10, 2);
        add_action('admin_init', [$this, 'register_settings']);
    }

    public function register_settings(): void {
        register_setting('general', $this->option_key, ['type' => 'array', 'default' => []]);
        add_settings_field($this->option_key, __('BLUMO Webhooks JSON', 'blumo-portrait-engine'), function () {
            $value = get_option($this->option_key, []);
            echo '<textarea name="' . esc_attr($this->option_key) . '" style="width:100%;min-height:140px">' . esc_textarea(wp_json_encode($value, JSON_PRETTY_PRINT)) . '</textarea>';
            echo '<p class="description">{ "order_created": "https://hook...", "photo_uploaded": "...", "state_changed": "...", "approval_received": "..." }</p>';
        }, 'general');
    }

    public function send(string $event, ?WC_Order $order, array $extra = []): void {
        if (! $order instanceof WC_Order) {
            return;
        }

        $raw = get_option($this->option_key, []);
        $endpoints = is_array($raw) ? $raw : json_decode((string) $raw, true);
        $url = $endpoints[$event] ?? '';

        if (! $url || ! wp_http_validate_url($url)) {
            return;
        }

        wp_remote_post($url, [
            'timeout' => 4,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode([
                'event' => $event,
                'order_id' => $order->get_id(),
                'state' => $order->get_meta('_bpe_workflow_state'),
                'total' => $order->get_total(),
                'photo_url' => $order->get_meta('_bpe_photo_url'),
                'timestamp' => current_time('mysql'),
                'extra' => $extra,
            ]),
        ]);
    }
}
