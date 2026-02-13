<?php

if (! defined('ABSPATH')) {
    exit;
}

class BPE_Configurator {
    private string $meta_key = '_bpe_config_schema';

    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
        add_action('woocommerce_before_add_to_cart_button', [$this, 'render_configurator_ui']);
        add_filter('woocommerce_add_cart_item_data', [$this, 'capture_cart_config'], 10, 3);
        add_action('woocommerce_checkout_create_order_line_item', [$this, 'persist_order_item_meta'], 10, 4);
        add_action('add_meta_boxes', [$this, 'register_product_metabox']);
        add_action('save_post_product', [$this, 'save_product_schema']);
    }

    public function register_routes(): void {
        register_rest_route('blumo/v1', '/config/(?P<product_id>\d+)', [
            'methods'  => 'GET',
            'permission_callback' => '__return_true',
            'callback' => function (WP_REST_Request $request) {
                $product_id = absint($request['product_id']);
                $schema = $this->get_product_schema($product_id);
                return rest_ensure_response($schema);
            },
        ]);

        register_rest_route('blumo/v1', '/price-quote', [
            'methods' => 'POST',
            'permission_callback' => function () {
                return wp_verify_nonce($_SERVER['HTTP_X_WP_NONCE'] ?? '', 'wp_rest');
            },
            'callback' => function (WP_REST_Request $request) {
                $payload = $request->get_json_params();
                $sanitized = $this->sanitize_selection($payload['selection'] ?? []);
                $product_id = absint($payload['product_id'] ?? 0);
                $schema = $this->get_product_schema($product_id);

                $price = $this->calculate_price($schema, $sanitized);
                $lead_time = $this->calculate_lead_time($schema, $sanitized);

                return rest_ensure_response([
                    'price' => wc_format_decimal($price, 2),
                    'lead_time_days' => $lead_time,
                    'selection' => $sanitized,
                ]);
            },
        ]);
    }

    public function render_configurator_ui(): void {
        global $product;
        if (! $product instanceof WC_Product) {
            return;
        }

        $schema = $this->get_product_schema((int) $product->get_id());
        echo '<section class="bpe-configurator blumo-paper" data-bpe-configurator data-schema="' . esc_attr(wp_json_encode($schema)) . '">';
        echo '<h3>' . esc_html__('Personaliza o retrato', 'blumo-portrait-engine') . '</h3>';
        echo '<div data-bpe-fields></div>';
        echo '<p><strong>' . esc_html__('Preço estimado:', 'blumo-portrait-engine') . '</strong> <span data-bpe-price></span></p>';
        echo '<p><strong>' . esc_html__('Entrega prevista:', 'blumo-portrait-engine') . '</strong> <span data-bpe-lead-time></span></p>';
        echo '<input type="hidden" name="bpe_config_selection" data-bpe-selection-field />';
        echo '</section>';
    }

    public function capture_cart_config(array $cart_item_data, int $product_id, int $variation_id): array {
        if (empty($_POST['bpe_config_selection'])) {
            return $cart_item_data;
        }

        $selection = json_decode(wp_unslash((string) $_POST['bpe_config_selection']), true);
        $cart_item_data['bpe_selection'] = $this->sanitize_selection(is_array($selection) ? $selection : []);
        return $cart_item_data;
    }

    public function persist_order_item_meta(WC_Order_Item_Product $item, string $cart_item_key, array $values, WC_Order $order): void {
        if (empty($values['bpe_selection'])) {
            return;
        }

        $item->add_meta_data(__('BLUMO Config', 'blumo-portrait-engine'), wp_json_encode($values['bpe_selection']), true);
    }

    public function register_product_metabox(): void {
        add_meta_box('bpe-config-schema', __('BLUMO Configurator Rules', 'blumo-portrait-engine'), [$this, 'render_metabox'], 'product', 'normal', 'high');
    }

    public function render_metabox(WP_Post $post): void {
        wp_nonce_field('bpe_save_schema', 'bpe_schema_nonce');
        $schema = $this->get_product_schema($post->ID);
        echo '<p>' . esc_html__('Formato JSON com pricing e lead time. Exemplo incluído por defeito.', 'blumo-portrait-engine') . '</p>';
        echo '<textarea style="width:100%;min-height:220px" name="bpe_config_schema">' . esc_textarea(wp_json_encode($schema, JSON_PRETTY_PRINT)) . '</textarea>';
    }

    public function save_product_schema(int $post_id): void {
        if (! isset($_POST['bpe_schema_nonce']) || ! wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['bpe_schema_nonce'])), 'bpe_save_schema')) {
            return;
        }
        if (! current_user_can('edit_post', $post_id)) {
            return;
        }

        $raw = wp_unslash((string) ($_POST['bpe_config_schema'] ?? ''));
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            update_post_meta($post_id, $this->meta_key, $decoded);
        }
    }

    private function get_product_schema(int $product_id): array {
        $schema = get_post_meta($product_id, $this->meta_key, true);
        if (is_array($schema) && ! empty($schema)) {
            return $schema;
        }

        return [
            'base_price' => 59,
            'sizes' => ['A5' => 0, 'A4' => 35, 'A3' => 70, 'CUSTOM' => 95],
            'people' => ['1' => 0, '2' => 20, '3' => 38, '4' => 56, '5' => 74],
            'background' => ['clean' => 0, 'soft_wash' => 15, 'detailed' => 29],
            'addons' => [
                'express_delivery' => ['label' => 'Entrega express', 'price' => 24, 'lead_time_delta' => -4],
                'extra_revision' => ['label' => 'Revisão extra', 'price' => 12, 'lead_time_delta' => 1],
                'digital_scan' => ['label' => 'Digital scan 4K', 'price' => 18, 'lead_time_delta' => 0],
            ],
            'lead_time_days' => ['base' => 12, 'A3' => 15, 'CUSTOM' => 20],
        ];
    }

    private function sanitize_selection(array $selection): array {
        return [
            'size' => sanitize_text_field($selection['size'] ?? 'A5'),
            'people' => (string) absint($selection['people'] ?? 1),
            'background' => sanitize_text_field($selection['background'] ?? 'clean'),
            'addons' => array_map('sanitize_text_field', array_values(array_filter((array) ($selection['addons'] ?? [])))),
        ];
    }

    private function calculate_price(array $schema, array $selection): float {
        $price = (float) ($schema['base_price'] ?? 0);
        $price += (float) ($schema['sizes'][$selection['size']] ?? 0);
        $price += (float) ($schema['people'][$selection['people']] ?? 0);
        $price += (float) ($schema['background'][$selection['background']] ?? 0);

        foreach ($selection['addons'] as $addon) {
            $price += (float) ($schema['addons'][$addon]['price'] ?? 0);
        }

        return $price;
    }

    private function calculate_lead_time(array $schema, array $selection): int {
        $lead = (int) ($schema['lead_time_days']['base'] ?? 12);
        $lead = (int) ($schema['lead_time_days'][$selection['size']] ?? $lead);

        foreach ($selection['addons'] as $addon) {
            $lead += (int) ($schema['addons'][$addon]['lead_time_delta'] ?? 0);
        }

        return max(2, $lead);
    }
}
