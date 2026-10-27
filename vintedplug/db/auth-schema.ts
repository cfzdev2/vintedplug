import {sqliteTable,text,integer,index,uniqueIndex} from "drizzle-orm/sqlite-core";

export const authUser=sqliteTable("vp_auth_user",{
 id:text("id").primaryKey(),name:text("name").notNull(),email:text("email").notNull().unique(),emailVerified:integer("email_verified",{mode:"boolean"}).notNull().default(false),image:text("image"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),updatedAt:integer("updated_at",{mode:"timestamp_ms"}).notNull(),
});
export const authSession=sqliteTable("vp_auth_session",{
 id:text("id").primaryKey(),expiresAt:integer("expires_at",{mode:"timestamp_ms"}).notNull(),token:text("token").notNull().unique(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),updatedAt:integer("updated_at",{mode:"timestamp_ms"}).notNull(),ipAddress:text("ip_address"),userAgent:text("user_agent"),userId:text("user_id").notNull().references(()=>authUser.id,{onDelete:"cascade"}),
},t=>[index("vp_auth_session_user").on(t.userId)]);
export const authAccount=sqliteTable("vp_auth_account",{
 id:text("id").primaryKey(),accountId:text("account_id").notNull(),providerId:text("provider_id").notNull(),userId:text("user_id").notNull().references(()=>authUser.id,{onDelete:"cascade"}),accessToken:text("access_token"),refreshToken:text("refresh_token"),idToken:text("id_token"),accessTokenExpiresAt:integer("access_token_expires_at",{mode:"timestamp_ms"}),refreshTokenExpiresAt:integer("refresh_token_expires_at",{mode:"timestamp_ms"}),scope:text("scope"),password:text("password"),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),updatedAt:integer("updated_at",{mode:"timestamp_ms"}).notNull(),
},t=>[index("vp_auth_account_user").on(t.userId),uniqueIndex("vp_auth_account_provider").on(t.providerId,t.accountId)]);
export const authVerification=sqliteTable("vp_auth_verification",{
 id:text("id").primaryKey(),identifier:text("identifier").notNull(),value:text("value").notNull(),expiresAt:integer("expires_at",{mode:"timestamp_ms"}).notNull(),createdAt:integer("created_at",{mode:"timestamp_ms"}).notNull(),updatedAt:integer("updated_at",{mode:"timestamp_ms"}).notNull(),
},t=>[index("vp_auth_verification_identifier").on(t.identifier)]);
export const authIdentity=sqliteTable("vp_auth_identity",{
 authUserId:text("auth_user_id").primaryKey().references(()=>authUser.id,{onDelete:"cascade"}),owner:text("owner").notNull().unique(),createdAt:text("created_at").notNull(),
});
export const authRateLimit=sqliteTable("vp_auth_rate_limit",{
 id:text("id").primaryKey(),key:text("key").notNull().unique(),count:integer("count").notNull(),lastRequest:integer("last_request").notNull(),
});
export const authSchema={user:authUser,session:authSession,account:authAccount,verification:authVerification,rateLimit:authRateLimit};
