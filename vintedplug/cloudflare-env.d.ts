declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    GEMINI_API_KEY?: string;
    GEMINI_TEXT_MODEL?: string;
    IMAGE_AI_ENABLED?: string;
    PHOTOROOM_API_KEY?: string;
    VP_GUIDE_AUTHOR_EMAIL?: string;
  }
}
