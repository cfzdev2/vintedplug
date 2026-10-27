declare namespace Cloudflare {
  interface Env {
    VP_AUTH_MODE?: "sites" | "standalone";
    BETTER_AUTH_SECRET?: string;
    RESEND_API_KEY?: string;
    AUTH_EMAIL_FROM?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_TEXT_MODEL?: string;
    IMAGE_AI_ENABLED?: string;
    PHOTOROOM_API_KEY?: string;
    VP_GUIDE_AUTHOR_EMAIL?: string;
    VP_BILLING_OWNER_ID?: string;
    VP_BILLING_KEYRING_SECRET?: string;
    VP_APP_ORIGIN?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_PRICE_ID?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    STRIPE_PORTAL_CONFIGURATION_ID?: string;
    STRIPE_MODE?: string;
  }
}
