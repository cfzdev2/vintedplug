CREATE TABLE `vp_billing` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`mode` text NOT NULL,
	`customer_id` text,
	`subscription_id` text,
	`status` text DEFAULT 'inactive' NOT NULL,
	`price_id` text,
	`paid_until` integer DEFAULT 0 NOT NULL,
	`period_end` integer DEFAULT 0 NOT NULL,
	`cancel_at` integer DEFAULT 0 NOT NULL,
	`cancel_at_period_end` integer DEFAULT 0 NOT NULL,
	`checkout_id` text,
	`checkout_attempt` text,
	`lease_token` text,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vp_billing_customer_id_unique` ON `vp_billing` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vp_billing_subscription_id_unique` ON `vp_billing` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `vp_billing_owner_mode` ON `vp_billing` (`owner`,`mode`);--> statement-breakpoint
CREATE TABLE `vp_billing_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`processed_at` text NOT NULL
);
