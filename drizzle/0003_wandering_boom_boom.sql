CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameAr` varchar(256) NOT NULL,
	`nameEn` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`level` int NOT NULL,
	`parentId` int,
	`listingCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_slug_unique` UNIQUE(`slug`)
);
