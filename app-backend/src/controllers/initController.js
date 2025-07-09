import { pool } from '../config/dbConfig.js';

export const initDatabase = async (req, res) => {
  try {
    // =============================
    // 1) Drop existing tables
    // =============================
    // The following lines will remove old tables so you can recreate them from scratch.
    // COMMENTED OUT: To prevent dropping tables on subsequent runs
    // If you need to reset the database, uncomment these lines temporarily
    
    // console.log('Dropping existing tables...');
    // await pool.query('DROP TABLE IF EXISTS task_conflicts CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS action_logs CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS tasks CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS boards CASCADE;');
    // await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    // console.log('All tables dropped successfully.');
    

    // =============================
    // 2) Create users table
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        address TEXT NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) CHECK (role IN ('user', 'admin', 'contractor')) NOT NULL,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // =============================
    // 3) Create boards table (renamed from companies)
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(id)
      );
    `);

    // =============================
    // 4) Create tasks table (renamed from applications)
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) CHECK (status IN ('Todo', 'In Progress', 'Done')) DEFAULT 'Todo',
        priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
        assigned_user_id INTEGER,
        board_id INTEGER NOT NULL,
        created_by_id INTEGER NOT NULL,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id),
        FOREIGN KEY (board_id) REFERENCES boards(id),
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      );
    `);

    // =============================
    // 5) Create action_logs table (new)
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        previous_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // =============================
    // 6) Create task_conflicts table (new)
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_conflicts (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        server_version JSONB NOT NULL,
        client_version JSONB NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // =============================
    // 7) Create task_locks table (new)
    // =============================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_locks (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(task_id)
      );
    `);

    // =============================
    // 7) Check for existing tables and migrate if needed
    // =============================
    // Check if old tables exist and migrate data if needed
    const { rows: companiesTableCheck } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'companies'
      ) as exists;
    `);

    if (companiesTableCheck[0].exists) {
      console.log('Migrating data from companies to boards...');
      // Copy data from companies to boards
      await pool.query(`
        INSERT INTO boards (id, name, description, owner_user_id, created_at)
        SELECT id, name, address, owner_user_id, created_at
        FROM companies
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    const { rows: applicationsTableCheck } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = current_schema() 
        AND table_name = 'applications'
      ) as exists;
    `);

    if (applicationsTableCheck[0].exists) {
      console.log('Migrating data from applications to tasks...');
      // Copy data from applications to tasks
      await pool.query(`
        INSERT INTO tasks (id, title, description, board_id, assigned_user_id, created_by_id, created_at)
        SELECT a.id, 'Task ' || a.id, a.comment, a.company_id, a.user_id, a.user_id, a.created_at
        FROM applications a
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    // =============================
    // 8) Seed sample data if empty
    // =============================
    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM users');
    if (parseInt(rows[0].count, 10) === 0) {
      // Insert sample users
      await pool.query(`
        INSERT INTO users (name, email, address, password, role) VALUES
        ('Test User',      'user@example.com',       '123 User St',       'password123',    'user'),
        ('Admin User',     'admin@example.com',      '456 Admin Ave',     'admin123',       'admin'),
        ('Contractor',     'contractor@example.com', '789 Company Blvd',  'contractor123',  'contractor');
      `);

      // Insert a sample board
      await pool.query(`
        INSERT INTO boards (name, description, owner_user_id)
        SELECT 'Sample Board', 'This is a sample board for tasks', id
        FROM users
        WHERE email = 'admin@example.com';
      `);

      // Insert sample tasks
      await pool.query(`
        INSERT INTO tasks (title, description, status, priority, assigned_user_id, board_id, created_by_id)
        SELECT 
          'Welcome Task', 
          'This is your first task on the board', 
          'Todo', 
          'Medium',
          (SELECT id FROM users WHERE email = 'user@example.com'),
          (SELECT id FROM boards LIMIT 1),
          (SELECT id FROM users WHERE email = 'admin@example.com');
      `);

      await pool.query(`
        INSERT INTO tasks (title, description, status, priority, assigned_user_id, board_id, created_by_id)
        SELECT 
          'Learn Drag and Drop', 
          'Try moving tasks between columns', 
          'In Progress', 
          'High',
          (SELECT id FROM users WHERE email = 'contractor@example.com'),
          (SELECT id FROM boards LIMIT 1),
          (SELECT id FROM users WHERE email = 'admin@example.com');
      `);

      await pool.query(`
        INSERT INTO tasks (title, description, status, priority, assigned_user_id, board_id, created_by_id)
        SELECT 
          'Completed Example', 
          'This task has been completed', 
          'Done', 
          'Low',
          (SELECT id FROM users WHERE email = 'admin@example.com'),
          (SELECT id FROM boards LIMIT 1),
          (SELECT id FROM users WHERE email = 'admin@example.com');
      `);

      // Insert a sample action log
      await pool.query(`
        INSERT INTO action_logs (task_id, user_id, action_type, previous_value, new_value)
        SELECT
          (SELECT id FROM tasks WHERE title = 'Completed Example'),
          (SELECT id FROM users WHERE email = 'admin@example.com'),
          'create',
          NULL,
          jsonb_build_object(
            'title', 'Completed Example',
            'status', 'Done',
            'priority', 'Low'
          );
      `);
    }

    res.json({ message: 'Database initialized successfully' });
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
};
