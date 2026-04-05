ALTER TABLE `listings` ADD `annualPayment` varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `paymentYears` int;--> statement-breakpoint
ALTER TABLE `listings` ADD `paymentDownPct` int;--> statement-breakpoint
ALTER TABLE `listings` ADD `showPrice` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `showDownpayment` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `showMonthly` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `showFullPrice` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `showCompound` int DEFAULT 1 NOT NULL;