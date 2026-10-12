-- V2__seed_channels.sql
-- Seed default public channels

INSERT INTO conversations (id, type, name, description, creator_id, created_at)
VALUES
    ('chan_general', 'CHANNEL', 'general', 'Campus LAN commons for announcements, wifi updates, and quick coordination.', 'system', CURRENT_TIMESTAMP),
    ('chan_project', 'CHANNEL', 'project-team', 'Third-year capstone team workspace: Java NIO server, client protocol, and final submission demo.', 'system', CURRENT_TIMESTAMP),
    ('chan_study', 'CHANNEL', 'study-room', 'Distributed Systems midterm revision, socket programming notes, and RFC references.', 'system', CURRENT_TIMESTAMP);
