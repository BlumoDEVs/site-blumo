<?php

if (! defined('ABSPATH')) {
    exit;
}

class BPE_Analytics {
    public function __construct() {
        add_action('wp_head', [$this, 'print_data_layer_bootstrap']);
        add_action('woocommerce_thankyou', [$this, 'track_purchase']);
        add_action('wp_dashboard_setup', [$this, 'register_dashboard_widget']);
    }

    public function print_data_layer_bootstrap(): void {
        echo "<script>window.dataLayer=window.dataLayer||[];window.blumoTrack=function(e,p){window.dataLayer.push(Object.assign({event:e},p||{}));};</script>";
    }

    public function track_purchase(int $order_id): void {
        $order = wc_get_order($order_id);
        if (! $order) {
            return;
        }
        printf('<script>blumoTrack("purchase_completed", {order_id:%d,total:%s});</script>', (int) $order_id, wp_json_encode((float) $order->get_total()));
    }

    public function register_dashboard_widget(): void {
        wp_add_dashboard_widget('bpe_funnel_widget', __('BLUMO Funnel Snapshot', 'blumo-portrait-engine'), [$this, 'render_widget']);
    }

    public function render_widget(): void {
        $orders = wc_get_orders(['limit' => 50, 'return' => 'objects']);
        $total = count($orders);
        $with_photo = 0;
        $approved = 0;
        foreach ($orders as $order) {
            if ($order->get_meta('_bpe_photo_url')) {
                $with_photo++;
            }
            if ('APPROVED' === $order->get_meta('_bpe_workflow_state')) {
                $approved++;
            }
        }
        echo '<ul><li>Últimas 50 encomendas: ' . esc_html((string) $total) . '</li><li>Com foto: ' . esc_html((string) $with_photo) . '</li><li>Aprovadas: ' . esc_html((string) $approved) . '</li></ul>';
    }
}
