CREATE TABLE `vp_earning_guides` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`chapters` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL
);
