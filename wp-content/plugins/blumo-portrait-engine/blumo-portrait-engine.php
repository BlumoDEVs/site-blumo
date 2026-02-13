<?php
/**
 * Plugin Name: BLUMO Portrait Engine
 * Description: Companion engine for WooCommerce portrait configuration, uploads, workflow, automation, and analytics.
 * Version: 1.0.0
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * Author: BLUMO
 * Text Domain: blumo-portrait-engine
 */

if (! defined('ABSPATH')) {
    exit;
}

define('BPE_VERSION', '1.0.0');
define('BPE_PATH', plugin_dir_path(__FILE__));
define('BPE_URL', plugin_dir_url(__FILE__));

require_once BPE_PATH . 'includes/class-bpe-configurator.php';
require_once BPE_PATH . 'includes/class-bpe-upload-manager.php';
require_once BPE_PATH . 'includes/class-bpe-workflow.php';
require_once BPE_PATH . 'includes/class-bpe-webhooks.php';
require_once BPE_PATH . 'includes/class-bpe-analytics.php';

final class Blumo_Portrait_Engine {
    public function __construct() {
        add_action('plugins_loaded', [$this, 'init']);
        register_activation_hook(__FILE__, [$this, 'on_activate']);
    }

    public function init(): void {
        if (! class_exists('WooCommerce')) {
            return;
        }

        new BPE_Configurator();
        new BPE_Upload_Manager();
        new BPE_Workflow();
        new BPE_Webhooks();
        new BPE_Analytics();

        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function enqueue_assets(): void {
        if (! is_product()) {
            return;
        }

        wp_enqueue_style('bpe-product-ui', BPE_URL . 'assets/css/product-ui.css', [], BPE_VERSION);
        wp_enqueue_script('bpe-configurator-ui', BPE_URL . 'assets/js/configurator-ui.js', [], BPE_VERSION, true);

        wp_localize_script('bpe-configurator-ui', 'bpeConfig', [
            'restUrl' => esc_url_raw(rest_url('blumo/v1/')),
            'nonce'   => wp_create_nonce('wp_rest'),
            'product' => get_the_ID(),
            'currencySymbol' => get_woocommerce_currency_symbol(),
        ]);
    }

    public function on_activate(): void {
        if (! wp_next_scheduled('bpe_daily_cleanup')) {
            wp_schedule_event(time(), 'daily', 'bpe_daily_cleanup');
        }
    }
}

new Blumo_Portrait_Engine();
