-- Create DB + user (adjust password/usernames for production)
-- Log into MySQL as root, then:
--   mysql -u root -p < server/mysql_setup.sql

CREATE DATABASE IF NOT EXISTS chatlab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'chatuser'@'localhost' IDENTIFIED BY 'changeme';
GRANT ALL PRIVILEGES ON chatlab.* TO 'chatuser'@'localhost';
FLUSH PRIVILEGES;

USE chatlab;

-- Users
CREATE TABLE IF NOT EXISTS users (
  username     VARCHAR(50)  PRIMARY KEY,
  passwordHash VARCHAR(255) NOT NULL,
  screenName   VARCHAR(50)  NOT NULL UNIQUE,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Rooms
CREATE TABLE IF NOT EXISTS list_of_chatrooms (
  chatroomName VARCHAR(100) PRIMARY KEY,
  chatroomKey  VARCHAR(100) NULL,          -- nullable so rooms can be unlocked
  creatorUsername VARCHAR(50) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_creator_username
    FOREIGN KEY (creatorUsername) REFERENCES users(username)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Current occupants
CREATE TABLE IF NOT EXISTS current_chatroom_occupants (
  chatroomName VARCHAR(100) NOT NULL,
  screenName   VARCHAR(50)  NOT NULL,
  socketId     VARCHAR(100) NOT NULL,
  joined_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chatroomName, screenName),
  CONSTRAINT fk_occ_room FOREIGN KEY (chatroomName) REFERENCES list_of_chatrooms(chatroomName) ON DELETE CASCADE,
  CONSTRAINT fk_occ_user FOREIGN KEY (screenName)   REFERENCES users(screenName)              ON DELETE CASCADE
) ENGINE=InnoDB;
