CREATE TABLE `vp_billing_keys` (
	`mode` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`ciphertext` text NOT NULL,
	`updated_at` text NOT NULL
);
