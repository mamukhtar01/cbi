-- Seed default admin user
-- Password: changeme123 (bcrypt hash)
-- Generated with: bcryptjs.hashSync('changeme123', 10)
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQCasW1KBe5HBfB3.tXrTKnKj0q5G6')
ON CONFLICT (username) DO NOTHING;
