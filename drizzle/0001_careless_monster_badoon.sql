ALTER TABLE `listings` MODIFY COLUMN `developer` varchar(128) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `project` varchar(128) NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE `listings` ADD `developerAr` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `developerEn` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `projectAr` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `projectEn` varchar(128) DEFAULT '' NOT NULL;