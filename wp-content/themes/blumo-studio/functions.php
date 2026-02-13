<?php
/**
 * Blumo Studio theme setup.
 *
 * @package BlumoStudio
 */

if (! defined('ABSPATH')) {
    exit;
}

define('BLUMO_THEME_VERSION', '1.0.0');

add_action('after_setup_theme', function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('woocommerce');
    add_theme_support('editor-styles');
    add_theme_support('align-wide');

    register_nav_menus([
        'primary' => __('Primary Menu', 'blumo-studio'),
        'footer'  => __('Footer Menu', 'blumo-studio'),
    ]);
});

add_action('wp_enqueue_scripts', function (): void {
    wp_enqueue_style('blumo-fonts', 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap', [], null);
    wp_enqueue_style('blumo-tokens', get_theme_file_uri('/assets/css/tokens.css'), [], BLUMO_THEME_VERSION);
    wp_enqueue_style('blumo-theme', get_theme_file_uri('/assets/css/theme.css'), ['blumo-tokens'], BLUMO_THEME_VERSION);

    wp_enqueue_script('blumo-theme-ui', get_theme_file_uri('/assets/js/theme-ui.js'), [], BLUMO_THEME_VERSION, true);
});

add_action('wp_footer', function (): void {
    if (! is_product()) {
        return;
    }

    echo '<div class="blumo-mobile-sticky-cta" data-blumo-mobile-cta>
        <button type="button" class="blumo-btn blumo-btn--primary" data-blumo-scroll-to-cart>' . esc_html__('Continuar para o carrinho', 'blumo-studio') . '</button>
    </div>';
});
