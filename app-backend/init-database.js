import dotenv from 'dotenv';
import { supabase } from './src/config/supabaseConfig.js';

dotenv.config();

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // For a fresh Supabase database, you need to create tables through the Supabase Dashboard
    // or use the service role key. Since we're using the anon key, we'll just check if tables exist
    // and insert sample data if they're empty.
    
    console.log('📊 Checking database structure...');
    
    // Check if users table exists by trying to query it
    const { data: usersCheck, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (usersError) {
      console.log('⚠️  Tables do not exist yet. Please create them first.');
      console.log('💡 You need to create the tables in Supabase Dashboard or use service role key.');
      console.log('📋 Required tables: users, boards, tasks, action_logs, task_conflicts, task_locks');
      
      console.log('\n📝 SQL to create tables:');
      console.log(`
-- 1. Create users table
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

-- 2. Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_user_id) REFERENCES users(id)
);

-- 3. Create tasks table
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

-- 4. Create action_logs table
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

-- 5. Create task_conflicts table
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

-- 6. Create task_locks table
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

-- Enable Row Level Security and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on boards" ON boards FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all operations on action_logs" ON action_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_conflicts" ON task_conflicts FOR ALL USING (true);
CREATE POLICY "Allow all operations on task_locks" ON task_locks FOR ALL USING (true);
      `);
      
      return false;
    }
    
    console.log('✅ Database tables exist');
    
    // Check if we need to insert sample data
    if (usersCheck === 0) {
      console.log('📝 Inserting sample data...');
      
      // Insert sample users
      const { data: insertedUsers, error: insertUsersError } = await supabase
        .from('users')
        .insert([
          { name: 'Test User', email: 'user@example.com', address: '123 User St', password: 'password123', role: 'user' },
          { name: 'Admin User', email: 'admin@example.com', address: '456 Admin Ave', password: 'admin123', role: 'admin' },
          { name: 'Contractor', email: 'contractor@example.com', address: '789 Company Blvd', password: 'contractor123', role: 'contractor' }
        ])
        .select();

      if (insertUsersError) {
        console.error('Error inserting sample users:', insertUsersError);
        return false;
      }
      
      console.log('✅ Sample users inserted');

      // Get admin user for board creation
      const adminUser = insertedUsers.find(u => u.email === 'admin@example.com');
      
      if (adminUser) {
        // Insert sample board
        const { data: board, error: boardError } = await supabase
          .from('boards')
          .insert([{ 
            name: 'Sample Board', 
            description: 'This is a sample board for tasks', 
            owner_user_id: adminUser.id 
          }])
          .select()
          .single();

        if (!boardError && board) {
          console.log('✅ Sample board inserted');

          // Get user IDs for task assignment
          const userUser = insertedUsers.find(u => u.email === 'user@example.com');
          const contractorUser = insertedUsers.find(u => u.email === 'contractor@example.com');

          // Insert sample tasks
          const { error: tasksInsertError } = await supabase
            .from('tasks')
            .insert([
              {
                title: 'Welcome Task',
                description: 'This is your first task on the board',
                status: 'Todo',
                priority: 'Medium',
                assigned_user_id: userUser?.id,
                board_id: board.id,
                created_by_id: adminUser.id
              },
              {
                title: 'Learn Drag and Drop',
                description: 'Try moving tasks between columns',
                status: 'In Progress',
                priority: 'High',
                assigned_user_id: contractorUser?.id,
                board_id: board.id,
                created_by_id: adminUser.id
              },
              {
                title: 'Completed Example',
                description: 'This task has been completed',
                status: 'Done',
                priority: 'Low',
                assigned_user_id: adminUser.id,
                board_id: board.id,
                created_by_id: adminUser.id
              }
            ]);

          if (tasksInsertError) {
            console.error('Error inserting sample tasks:', tasksInsertError);
            return false;
          } else {
            console.log('✅ Sample tasks inserted');
          }
        }
      }
    } else {
      console.log('📊 Database already has data, skipping sample data insertion');
    }

    console.log('🎉 Database initialization completed successfully!');
    return true;
    
  } catch (err) {
    console.error('Database initialization error:', err);
    return false;
  }
}

// Run the initialization
initDatabase().then((success) => {
  if (success) {
    console.log('✅ Initialization successful!');
  } else {
    console.log('❌ Initialization failed!');
  }
  process.exit(success ? 0 : 1);
});
