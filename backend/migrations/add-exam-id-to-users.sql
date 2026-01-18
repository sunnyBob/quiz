-- Migration: Add exam_id to users table and create unique constraint
-- This ensures that each user name is unique per exam, allowing same names across different exams

-- Step 1: Add exam_id column (nullable first to allow existing data)
ALTER TABLE users ADD COLUMN exam_id INT DEFAULT NULL;

-- Step 2: Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT fk_users_exam 
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- Step 3: Update existing records
-- If there are existing users, we need to link them to their exam via results table
UPDATE users u
INNER JOIN (
  SELECT user_id, exam_id 
  FROM results 
  GROUP BY user_id
) r ON u.id = r.user_id
SET u.exam_id = r.exam_id;

-- Step 4: Make exam_id NOT NULL (after existing data is updated)
ALTER TABLE users MODIFY COLUMN exam_id INT NOT NULL;

-- Step 5: Add unique constraint on (name, exam_id) combination
ALTER TABLE users ADD UNIQUE KEY unique_user_per_exam (name, exam_id);

-- Step 6: Add index for better query performance
CREATE INDEX idx_users_exam_id ON users(exam_id);
CREATE INDEX idx_users_name ON users(name);
