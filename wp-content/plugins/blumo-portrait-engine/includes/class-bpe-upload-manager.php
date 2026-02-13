<?php

if (! defined('ABSPATH')) {
    exit;
}

class BPE_Upload_Manager {
    private string $option_retention = 'bpe_retention_days';

    public function __construct() {
        add_action('woocommerce_before_add_to_cart_button', [$this, 'render_upload_fields']);
        add_filter('woocommerce_add_to_cart_validation', [$this, 'validate_upload'], 10, 3);
        add_action('woocommerce_checkout_create_order', [$this, 'attach_upload_to_order'], 10, 2);
        add_action('woocommerce_admin_order_data_after_billing_address', [$this, 'render_admin_upload_preview']);
        add_action('woocommerce_email_after_order_table', [$this, 'append_admin_email_upload'], 10, 4);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('bpe_daily_cleanup', [$this, 'cleanup_old_uploads']);
    }

    public function render_upload_fields(): void {
        echo '<section class="bpe-upload blumo-paper" data-bpe-upload>';
        echo '<h4>' . esc_html__('Carrega a tua foto', 'blumo-portrait-engine') . '</h4>';
        echo '<input type="file" name="bpe_photo" accept="image/jpeg,image/png,.heic" required aria-label="Upload da foto" />';
        echo '<label><input type="checkbox" name="bpe_consent" required /> ' . esc_html__('Autorizo o tratamento da foto para produção do retrato.', 'blumo-portrait-engine') . '</label>';
        echo '<input type="hidden" name="bpe_quality_score" data-bpe-quality-score value="0" />';
        echo '<div data-bpe-quality-report></div>';
        echo '</section>';
    }

    public function validate_upload(bool $passed, int $product_id, int $qty): bool {
        if (empty($_FILES['bpe_photo']['name'])) {
            wc_add_notice(__('É obrigatório enviar uma foto.', 'blumo-portrait-engine'), 'error');
            return false;
        }

        if (empty($_POST['bpe_consent'])) {
            wc_add_notice(__('Precisas de consentir o tratamento da imagem.', 'blumo-portrait-engine'), 'error');
            return false;
        }

        $allowed = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
        $tmp_name = $_FILES['bpe_photo']['tmp_name'];
        $mime = mime_content_type($tmp_name) ?: '';

        if (! in_array($mime, $allowed, true)) {
            wc_add_notice(__('Formato inválido. Usa JPG, PNG ou HEIC.', 'blumo-portrait-engine'), 'error');
            return false;
        }

        $size = (int) ($_FILES['bpe_photo']['size'] ?? 0);
        if ($size > 10 * 1024 * 1024) {
            wc_add_notice(__('A imagem excede 10MB.', 'blumo-portrait-engine'), 'error');
            return false;
        }

        return $passed;
    }

    public function attach_upload_to_order(WC_Order $order, array $data): void {
        if (empty($_FILES['bpe_photo']['name'])) {
            return;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        $upload = wp_handle_upload($_FILES['bpe_photo'], ['test_form' => false, 'mimes' => ['jpg|jpeg' => 'image/jpeg', 'png' => 'image/png', 'heic|heif' => 'image/heic']]);

        if (! empty($upload['error'])) {
            $order->add_order_note('BLUMO upload falhou: ' . sanitize_text_field($upload['error']));
            return;
        }

        $order->update_meta_data('_bpe_photo_url', esc_url_raw($upload['url']));
        $order->update_meta_data('_bpe_photo_path', sanitize_text_field($upload['file']));
        $order->update_meta_data('_bpe_photo_uploaded_at', current_time('mysql'));
        $order->update_meta_data('_bpe_photo_consent_at', current_time('mysql'));
        $order->update_meta_data('_bpe_quality_score', absint($_POST['bpe_quality_score'] ?? 0));
        $order->save();
    }

    public function render_admin_upload_preview(WC_Order $order): void {
        $url = (string) $order->get_meta('_bpe_photo_url');
        if (! $url) {
            return;
        }

        echo '<p><strong>BLUMO Photo:</strong><br/><a href="' . esc_url($url) . '" target="_blank" rel="noopener">Download</a></p>';
        echo '<img src="' . esc_url($url) . '" alt="BLUMO Upload" style="max-width:180px;height:auto;border-radius:8px" />';
    }

    public function append_admin_email_upload(WC_Order $order, bool $sent_to_admin, bool $plain_text, WC_Email $email): void {
        if (! $sent_to_admin) {
            return;
        }

        $url = (string) $order->get_meta('_bpe_photo_url');
        if ($url) {
            echo '<p><strong>BLUMO Upload:</strong> <a href="' . esc_url($url) . '">' . esc_html($url) . '</a></p>';
        }
    }

    public function register_settings(): void {
        register_setting('general', $this->option_retention, ['type' => 'integer', 'default' => 45]);
        add_settings_field($this->option_retention, __('BLUMO retenção de uploads (dias)', 'blumo-portrait-engine'), function () {
            $value = (int) get_option($this->option_retention, 45);
            echo '<input type="number" min="1" name="' . esc_attr($this->option_retention) . '" value="' . esc_attr((string) $value) . '" />';
        }, 'general');
    }

    public function cleanup_old_uploads(): void {
        $retention_days = max(1, (int) get_option($this->option_retention, 45));
        $cutoff = strtotime('-' . $retention_days . ' days');

        $orders = wc_get_orders([
            'limit' => -1,
            'return' => 'objects',
            'meta_key' => '_bpe_photo_uploaded_at',
        ]);

        foreach ($orders as $order) {
            $uploaded_at = strtotime((string) $order->get_meta('_bpe_photo_uploaded_at'));
            if (! $uploaded_at || $uploaded_at > $cutoff) {
                continue;
            }

            $path = (string) $order->get_meta('_bpe_photo_path');
            if ($path && file_exists($path)) {
                wp_delete_file($path);
            }

            $order->delete_meta_data('_bpe_photo_url');
            $order->delete_meta_data('_bpe_photo_path');
            $order->save();
        }
    }
}
