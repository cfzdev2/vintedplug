CREATE TABLE `vp_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`handle` text DEFAULT '' NOT NULL,
	`color` text DEFAULT '#087f72' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vp_accounts_owner` ON `vp_accounts` (`owner`);--> statement-breakpoint
CREATE TABLE `vp_ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vp_expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account_id` text NOT NULL,
	`label` text NOT NULL,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`category` text DEFAULT 'Inne' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `vp_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vp_expenses_owner_account` ON `vp_expenses` (`owner`,`account_id`);--> statement-breakpoint
CREATE TABLE `vp_items` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`account_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`category` text DEFAULT 'Inne' NOT NULL,
	`size` text DEFAULT '' NOT NULL,
	`condition` text DEFAULT 'Bardzo dobry' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`measurements` text DEFAULT '' NOT NULL,
	`flaws` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`purchase_price` integer DEFAULT 0 NOT NULL,
	`extra_cost` integer DEFAULT 0 NOT NULL,
	`list_price` integer DEFAULT 0 NOT NULL,
	`sale_price` integer,
	`minimum_profit` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`purchase_date` text NOT NULL,
	`list_date` text,
	`sale_date` text,
	`image_ids` text DEFAULT '[]' NOT NULL,
	`illustration` text DEFAULT 'hoodie' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `vp_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `vp_items_owner_account` ON `vp_items` (`owner`,`account_id`);--> statement-breakpoint
CREATE TABLE `vp_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`key` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `vp_uploads_owner` ON `vp_uploads` (`owner`);