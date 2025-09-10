import dotenv from 'dotenv';
import { supabase } from './src/config/supabaseConfig.js';

dotenv.config();

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Anon Key (first 20 chars):', process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
  
  try {
    // Test basic connection with auth session (doesn't require tables)
    console.log('📡 Testing basic connection...');
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Basic connection failed:', error.message);
      console.error('Full error:', error);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('💡 Database is ready - you can now run initialization');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    console.error('Full error:', err);
    return false;
  }
}

// Run the test
testConnection().then((success) => {
  if (success) {
    console.log('🎉 Connection test passed!');
  } else {
    console.log('💥 Connection test failed!');
  }
  process.exit(success ? 0 : 1);
});
