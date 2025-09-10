import { supabase } from '../config/supabaseConfig.js';

export const initDatabase = async (req, res) => {
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
      
      return res.status(400).json({ 
        error: 'Database tables not found',
        message: 'Please create the required tables in Supabase Dashboard first',
        tables: ['users', 'boards', 'tasks', 'action_logs', 'task_conflicts', 'task_locks']
      });
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
        return res.status(500).json({ error: 'Failed to insert sample users' });
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
          } else {
            console.log('✅ Sample tasks inserted');
          }
        }
      }
    } else {
      console.log('📊 Database already has data, skipping sample data insertion');
    }

    res.json({ 
      message: 'Database initialization completed successfully',
      tablesExist: true,
      sampleDataInserted: usersCheck === 0
    });
    
  } catch (err) {
    console.error('Database initialization error:', err);
    res.status(500).json({ error: 'Failed to initialize database', details: err.message });
  }
};
