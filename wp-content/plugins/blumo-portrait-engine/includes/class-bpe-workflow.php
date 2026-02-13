<?php

if (! defined('ABSPATH')) {
    exit;
}

class BPE_Workflow {
    private array $states = [
        'PHOTO_RECEIVED',
        'IN_REVIEW',
        'DRAFT_SENT',
        'APPROVAL_REQUESTED',
        'APPROVED',
        'FINALIZED',
        'SHIPPED',
    ];

    public function __construct() {
        add_action('add_meta_boxes_shop_order', [$this, 'register_metabox']);
        add_action('admin_post_bpe_update_state', [$this, 'handle_state_update']);
        add_action('woocommerce_checkout_order_processed', [$this, 'mark_photo_received']);
        add_action('init', [$this, 'register_approval_route']);
    }

    public function register_metabox(): void {
        add_meta_box('bpe-workflow', __('BLUMO Workflow', 'blumo-portrait-engine'), [$this, 'render_metabox'], 'shop_order', 'side', 'high');
    }

    public function render_metabox(WP_Post $post): void {
        $order = wc_get_order($post->ID);
        if (! $order) {
            return;
        }
        $current = (string) $order->get_meta('_bpe_workflow_state');
        echo '<p><strong>Estado atual:</strong> ' . esc_html($current ?: 'N/A') . '</p>';

        foreach ($this->states as $state) {
            $url = wp_nonce_url(admin_url('admin-post.php?action=bpe_update_state&order_id=' . $order->get_id() . '&state=' . $state), 'bpe_update_state');
            echo '<p><a class="button button-secondary" href="' . esc_url($url) . '">' . esc_html($state) . '</a></p>';
        }
    }

    public function handle_state_update(): void {
        check_admin_referer('bpe_update_state');
        if (! current_user_can('edit_shop_orders')) {
            wp_die('Forbidden');
        }

        $order_id = absint($_GET['order_id'] ?? 0);
        $state = sanitize_text_field($_GET['state'] ?? '');
        if (! in_array($state, $this->states, true)) {
            wp_safe_redirect(wp_get_referer() ?: admin_url());
            exit;
        }

        $order = wc_get_order($order_id);
        if (! $order) {
            wp_safe_redirect(wp_get_referer() ?: admin_url());
            exit;
        }

        $order->update_meta_data('_bpe_workflow_state', $state);
        $order->save();
        $order->add_order_note('BLUMO state updated to ' . $state);

        do_action('bpe_workflow_state_changed', $order, $state);
        $this->send_state_email($order, $state);

        wp_safe_redirect(wp_get_referer() ?: admin_url());
        exit;
    }

    public function mark_photo_received(int $order_id): void {
        $order = wc_get_order($order_id);
        if (! $order) {
            return;
        }
        $order->update_meta_data('_bpe_workflow_state', 'PHOTO_RECEIVED');
        $token = wp_generate_password(28, false);
        $order->update_meta_data('_bpe_approval_token', wp_hash($token));
        $order->update_meta_data('_bpe_approval_link', add_query_arg(['bpe_approve' => $order->get_id(), 'token' => $token], home_url('/')));
        $order->save();
    }

    private function send_state_email(WC_Order $order, string $state): void {
        $map = [
            'PHOTO_RECEIVED' => 'Recebemos a tua foto',
            'IN_REVIEW' => 'A preparar rascunho',
            'APPROVAL_REQUESTED' => 'Preciso da tua aprovação',
            'SHIPPED' => 'Enviado',
        ];

        if (empty($map[$state])) {
            return;
        }

        wp_mail($order->get_billing_email(), $map[$state], sprintf('Estado da encomenda #%d: %s', $order->get_id(), $map[$state]));
    }

    public function register_approval_route(): void {
        add_rewrite_tag('%bpe_approve%', '(\d+)');
        add_action('template_redirect', function () {
            $order_id = absint($_GET['bpe_approve'] ?? 0);
            if (! $order_id) {
                return;
            }
            $order = wc_get_order($order_id);
            if (! $order) {
                wp_die('Order not found');
            }

            $token = sanitize_text_field($_GET['token'] ?? '');
            if (! hash_equals((string) $order->get_meta('_bpe_approval_token'), wp_hash($token))) {
                wp_die('Invalid token');
            }

            if (isset($_GET['decision'])) {
                $decision = sanitize_text_field($_GET['decision']);
                $message = sanitize_text_field($_GET['message'] ?? '');
                $order->update_meta_data('_bpe_approval_decision', $decision);
                $order->add_order_note('Client decision: ' . $decision . ($message ? ' | ' . $message : ''));
                if ('approve' === $decision) {
                    $order->update_meta_data('_bpe_workflow_state', 'APPROVED');
                }
                $order->save();
                wp_die('Obrigado! Decisão recebida.');
            }

            $approve = add_query_arg(['bpe_approve' => $order_id, 'token' => $token, 'decision' => 'approve'], home_url('/'));
            $adjust = add_query_arg(['bpe_approve' => $order_id, 'token' => $token, 'decision' => 'adjust'], home_url('/'));
            wp_die('<h1>Revisão do retrato</h1><p><a href="' . esc_url($approve) . '">Aprovar</a> | <a href="' . esc_url($adjust) . '">Pedir ajuste</a></p>');
        });
    }
}
