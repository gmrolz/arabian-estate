ALTER TABLE `listings` MODIFY COLUMN `showFullPrice` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listings` ADD `showAnnual` int DEFAULT 0 NOT NULL;