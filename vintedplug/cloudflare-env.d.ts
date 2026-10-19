declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_TEXT_MODEL?: string;
    OPENAI_IMAGE_MODEL?: string;
    IMAGE_AI_ENABLED?: string;
    VP_GUIDE_AUTHOR_EMAIL?: string;
  }
}
