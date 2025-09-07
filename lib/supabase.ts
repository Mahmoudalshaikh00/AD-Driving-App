import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Supabase client for development
// This provides offline functionality until real Supabase credentials are configured

const MOCK_USERS_KEY = 'mock_users';
const MOCK_SESSION_KEY = 'mock_session';
const MOCK_CHAT_MESSAGES_KEY = 'mock_chat_messages';

// Store auth state change callbacks
let authStateChangeCallbacks: ((event: string, session: MockSession | null) => void)[] = [];

// Mock user data
interface MockUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'instructor' | 'student';
  instructor_id?: string;
  created_at: string;
}

interface MockSession {
  user: { id: string; email: string };
  access_token: string;
}

interface MockChatMessage {
  id: string;
  student_id: string;
  instructor_id: string;
  sender_id: string;
  text?: string;
  attachments?: any[];
  created_at: string;
  isReport?: boolean;
  reportTitle?: string;
}

// Helper functions for mock data
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const getMockUsers = async (): Promise<MockUser[]> => {
  try {
    const stored = await AsyncStorage.getItem(MOCK_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveMockUsers = async (users: MockUser[]) => {
  await AsyncStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

const getMockSession = async (): Promise<MockSession | null> => {
  try {
    const stored = await AsyncStorage.getItem(MOCK_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveMockSession = async (session: MockSession | null) => {
  if (session) {
    await AsyncStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(MOCK_SESSION_KEY);
  }
};

const getMockChatMessages = async (): Promise<MockChatMessage[]> => {
  try {
    const stored = await AsyncStorage.getItem(MOCK_CHAT_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveMockChatMessages = async (messages: MockChatMessage[]) => {
  await AsyncStorage.setItem(MOCK_CHAT_MESSAGES_KEY, JSON.stringify(messages));
};

// Mock Supabase client
export const supabase = {
  auth: {
    async getSession() {
      const session = await getMockSession();
      return { data: { session }, error: null };
    },

    async signUp({ email, password }: { email: string; password: string }) {
      try {
        const users = await getMockUsers();
        
        // Check if user already exists
        if (users.find(u => u.email === email)) {
          return { data: null, error: { message: 'User already exists' } };
        }

        const newUser = {
          id: generateId(),
          email,
          password, // In real app, this would be hashed
        };

        return { data: { user: newUser }, error: null };
      } catch {
        return { data: null, error: { message: 'Sign up failed' } };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        console.log('🔐 Attempting sign in with:', email);
        const users = await getMockUsers();
        console.log('👥 Available users:', users.map(u => ({ email: u.email, role: u.role })));
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          console.log('❌ No matching user found');
          return { data: null, error: { message: 'Invalid credentials' } };
        }

        console.log('✅ User found:', { email: user.email, role: user.role });
        const session: MockSession = {
          user: { id: user.id, email: user.email },
          access_token: 'mock-token-' + Date.now(),
        };

        await saveMockSession(session);
        console.log('💾 Session saved successfully');
        
        // Trigger auth state change callbacks
        console.log('🔄 Triggering auth state change callbacks:', authStateChangeCallbacks.length);
        authStateChangeCallbacks.forEach(callback => {
          try {
            callback('SIGNED_IN', session);
          } catch (error) {
            console.error('Error in auth state change callback:', error);
          }
        });
        
        return { data: { user: session.user }, error: null };
      } catch (error) {
        console.error('🚨 Sign in error:', error);
        return { data: null, error: { message: 'Sign in failed' } };
      }
    },

    async signOut() {
      try {
        await saveMockSession(null);
        
        // Trigger auth state change callbacks
        authStateChangeCallbacks.forEach(callback => {
          try {
            callback('SIGNED_OUT', null);
          } catch (error) {
            console.error('Error in auth state change callback:', error);
          }
        });
        
        return { error: null };
      } catch {
        return { error: { message: 'Sign out failed' } };
      }
    },

    onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
      console.log('📝 Registering auth state change callback');
      
      // Add callback to the list
      authStateChangeCallbacks.push(callback);
      
      // Trigger callback immediately with current session
      getMockSession().then(session => {
        if (session) {
          console.log('🔄 Initial auth state: SIGNED_IN');
          callback('SIGNED_IN', session);
        } else {
          console.log('🔄 Initial auth state: SIGNED_OUT');
          callback('SIGNED_OUT', null);
        }
      });
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              console.log('🗑️ Unsubscribing auth state change callback');
              const index = authStateChangeCallbacks.indexOf(callback);
              if (index > -1) {
                authStateChangeCallbacks.splice(index, 1);
              }
            }
          }
        }
      };
    },
  },

  from(table: string) {
    const createQueryBuilder = (filters: { column: string; value: any }[] = []) => {
      return {
        select: (columns: string) => {
          const queryBuilder = {
            eq: (column: string, value: any) => {
              const newFilters = [...filters, { column, value }];
              return createQueryBuilder(newFilters).select(columns);
            },
            order: (column: string, options?: { ascending?: boolean }) => {
              return {
                ...queryBuilder,
                then(resolve: any) {
                  return new Promise(async (promiseResolve) => {
                    try {
                      if (table === 'users') {
                        const users = await getMockUsers();
                        let filteredUsers = users;
                        
                        // Apply all filters
                        for (const filter of filters) {
                          filteredUsers = filteredUsers.filter(u => (u as any)[filter.column] === filter.value);
                        }
                        
                        // Apply ordering
                        filteredUsers.sort((a, b) => {
                          const aVal = (a as any)[column];
                          const bVal = (b as any)[column];
                          if (options?.ascending === false) {
                            return bVal.localeCompare(aVal);
                          }
                          return aVal.localeCompare(bVal);
                        });
                        
                        const result = { data: filteredUsers, error: null };
                        resolve(result);
                        promiseResolve(result);
                      } else if (table === 'chat_messages') {
                        const messages = await getMockChatMessages();
                        let filteredMessages = messages;
                        
                        // Apply all filters
                        for (const filter of filters) {
                          filteredMessages = filteredMessages.filter(m => (m as any)[filter.column] === filter.value);
                        }
                        
                        // Apply ordering
                        filteredMessages.sort((a, b) => {
                          const aVal = (a as any)[column];
                          const bVal = (b as any)[column];
                          if (options?.ascending === false) {
                            return new Date(bVal).getTime() - new Date(aVal).getTime();
                          }
                          return new Date(aVal).getTime() - new Date(bVal).getTime();
                        });
                        
                        const result = { data: filteredMessages, error: null };
                        resolve(result);
                        promiseResolve(result);
                      } else {
                        const result = { data: [], error: null };
                        resolve(result);
                        promiseResolve(result);
                      }
                    } catch (error) {
                      const result = { data: null, error: { message: 'Query failed' } };
                      resolve(result);
                      promiseResolve(result);
                    }
                  });
                }
              };
            },
            single: async () => {
              try {
                if (table === 'users') {
                  const users = await getMockUsers();
                  let user: MockUser | undefined = users[0];
                  
                  // Apply all filters
                  for (const filter of filters) {
                    user = users.find(u => (u as any)[filter.column] === filter.value);
                    if (!user) break;
                  }
                  
                  return user ? { data: user, error: null } : { data: null, error: { message: 'User not found' } };
                }
                return { data: null, error: { message: 'Table not found' } };
              } catch {
                return { data: null, error: { message: 'Query failed' } };
              }
            },
            then(resolve: any) {
              return new Promise(async (promiseResolve) => {
                try {
                  if (table === 'users') {
                    const users = await getMockUsers();
                    let filteredUsers = users;
                    
                    // Apply all filters
                    for (const filter of filters) {
                      filteredUsers = filteredUsers.filter(u => (u as any)[filter.column] === filter.value);
                    }
                    
                    const result = { data: filteredUsers, error: null };
                    resolve(result);
                    promiseResolve(result);
                  } else if (table === 'chat_messages') {
                    const messages = await getMockChatMessages();
                    let filteredMessages = messages;
                    
                    // Apply all filters
                    for (const filter of filters) {
                      filteredMessages = filteredMessages.filter(m => (m as any)[filter.column] === filter.value);
                    }
                    
                    const result = { data: filteredMessages, error: null };
                    resolve(result);
                    promiseResolve(result);
                  } else {
                    const result = { data: [], error: null };
                    resolve(result);
                    promiseResolve(result);
                  }
                } catch (error) {
                  const result = { data: null, error: { message: 'Query failed' } };
                  resolve(result);
                  promiseResolve(result);
                }
              });
            }
          };
          return queryBuilder;
        },
        
        insert: (data: any) => ({
          select: async () => {
            try {
              if (table === 'users') {
                console.log('📝 Inserting user into mock database:', data);
                const users = await getMockUsers();
                
                // For student creation, we need to also store the password
                // The password should come from the auth.signUp call
                const newUser: MockUser = {
                  id: data.id || generateId(),
                  ...data,
                  password: data.password || 'defaultPassword123', // Fallback password
                  created_at: new Date().toISOString(),
                };
                
                users.push(newUser);
                await saveMockUsers(users);
                console.log('✅ User inserted successfully:', { id: newUser.id, email: newUser.email, role: newUser.role });
                return { data: [newUser], error: null };
              } else if (table === 'chat_messages') {
                console.log('📝 Inserting chat message into mock database:', data);
                const messages = await getMockChatMessages();
                
                const newMessage: MockChatMessage = {
                  id: data.id || generateId(),
                  ...data,
                  created_at: data.created_at || new Date().toISOString(),
                };
                
                messages.push(newMessage);
                await saveMockChatMessages(messages);
                console.log('✅ Chat message inserted successfully:', { id: newMessage.id });
                return { data: [newMessage], error: null };
              }
              return { data: null, error: { message: 'Insert failed' } };
            } catch (error) {
              console.error('🚨 Insert error:', error);
              return { data: null, error: { message: 'Insert failed' } };
            }
          },
          then(resolve: any) {
            return new Promise(async (promiseResolve) => {
              try {
                if (table === 'users') {
                  console.log('📝 Inserting user into mock database (then):', data);
                  const users = await getMockUsers();
                  
                  // For student creation, we need to also store the password
                  const newUser: MockUser = {
                    id: data.id || generateId(),
                    ...data,
                    password: data.password || 'defaultPassword123', // Fallback password
                    created_at: new Date().toISOString(),
                  };
                  
                  users.push(newUser);
                  await saveMockUsers(users);
                  console.log('✅ User inserted successfully (then):', { id: newUser.id, email: newUser.email, role: newUser.role });
                  const result = { data: newUser, error: null };
                  resolve(result);
                  promiseResolve(result);
                } else if (table === 'chat_messages') {
                  console.log('📝 Inserting chat message into mock database (then):', data);
                  const messages = await getMockChatMessages();
                  
                  const newMessage: MockChatMessage = {
                    id: data.id || generateId(),
                    ...data,
                    created_at: data.created_at || new Date().toISOString(),
                  };
                  
                  messages.push(newMessage);
                  await saveMockChatMessages(messages);
                  console.log('✅ Chat message inserted successfully (then):', { id: newMessage.id });
                  const result = { data: newMessage, error: null };
                  resolve(result);
                  promiseResolve(result);
                } else {
                  const result = { data: null, error: { message: 'Insert failed' } };
                  resolve(result);
                  promiseResolve(result);
                }
              } catch (error) {
                console.error('🚨 Insert error (then):', error);
                const result = { data: null, error: { message: 'Insert failed' } };
                resolve(result);
                promiseResolve(result);
              }
            });
          }
        }),
        
        update: (data: any) => {
          const createUpdateBuilder = (filters: { column: string; value: any }[] = []) => {
            return {
              eq: (column: string, value: any) => {
                const newFilters = [...filters, { column, value }];
                return createUpdateBuilder(newFilters);
              },
              then(resolve: any) {
                return new Promise(async (promiseResolve) => {
                  try {
                    if (table === 'users') {
                      const users = await getMockUsers();
                      let userIndex = -1;
                      
                      // Apply all filters to find the user
                      for (let i = 0; i < users.length; i++) {
                        let matches = true;
                        for (const filter of filters) {
                          if ((users[i] as any)[filter.column] !== filter.value) {
                            matches = false;
                            break;
                          }
                        }
                        if (matches) {
                          userIndex = i;
                          break;
                        }
                      }
                      
                      if (userIndex !== -1) {
                        users[userIndex] = { ...users[userIndex], ...data };
                        await saveMockUsers(users);
                        const result = { data: users[userIndex], error: null };
                        resolve(result);
                        promiseResolve(result);
                      } else {
                        const result = { data: null, error: { message: 'User not found' } };
                        resolve(result);
                        promiseResolve(result);
                      }
                    } else {
                      const result = { data: null, error: { message: 'Table not found' } };
                      resolve(result);
                      promiseResolve(result);
                    }
                  } catch (error) {
                    const result = { data: null, error: { message: 'Update failed' } };
                    resolve(result);
                    promiseResolve(result);
                  }
                });
              }
            };
          };
          return createUpdateBuilder();
        },
        
        delete: () => {
          const createDeleteBuilder = (filters: { column: string; value: any }[] = []) => {
            return {
              eq: (column: string, value: any) => {
                const newFilters = [...filters, { column, value }];
                return createDeleteBuilder(newFilters);
              },
              then(resolve: any) {
                return new Promise(async (promiseResolve) => {
                  try {
                    if (table === 'users') {
                      const users = await getMockUsers();
                      const filteredUsers = users.filter(user => {
                        // Apply all filters - user should NOT match all filters to be kept
                        for (const filter of filters) {
                          if ((user as any)[filter.column] === filter.value) {
                            return false; // This user matches a filter, so remove it
                          }
                        }
                        return true; // Keep this user
                      });
                      await saveMockUsers(filteredUsers);
                      const result = { data: null, error: null };
                      resolve(result);
                      promiseResolve(result);
                    } else {
                      const result = { data: null, error: { message: 'Table not found' } };
                      resolve(result);
                      promiseResolve(result);
                    }
                  } catch (error) {
                    const result = { data: null, error: { message: 'Delete failed' } };
                    resolve(result);
                    promiseResolve(result);
                  }
                });
              }
            };
          };
          return createDeleteBuilder();
        }
      };
    };
    
    return createQueryBuilder();
  }
};

// Initialize with default instructor account
const initializeMockData = async () => {
  const users = await getMockUsers();

  // Seed base demo data if storage empty
  if (users.length === 0) {
    const defaultInstructor1: MockUser = {
      id: 'instructor-1',
      email: 'instructor1@example.com',
      password: 'Password123',
      name: 'Demo Instructor 1',
      role: 'instructor',
      created_at: new Date().toISOString(),
    };
    
    const defaultInstructor2: MockUser = {
      id: 'instructor-2',
      email: 'instructor2@example.com',
      password: 'Password123',
      name: 'Demo Instructor 2',
      role: 'instructor',
      created_at: new Date().toISOString(),
    };
    
    const defaultStudent1: MockUser = {
      id: 'student-1',
      email: 'student1@example.com',
      password: 'password123',
      name: 'Demo Student 1',
      role: 'student',
      instructor_id: 'instructor-1',
      created_at: new Date().toISOString(),
    };
    
    const defaultStudent2: MockUser = {
      id: 'student-2',
      email: 'student2@example.com',
      password: 'password123',
      name: 'Demo Student 2',
      role: 'student',
      instructor_id: 'instructor-2',
      created_at: new Date().toISOString(),
    };
    
    await saveMockUsers([defaultInstructor1, defaultInstructor2, defaultStudent1, defaultStudent2]);
    console.log('📝 Mock data initialized with demo accounts:');
    console.log('Instructor 1: instructor1@example.com / Password123');
    console.log('Instructor 2: instructor2@example.com / Password123');
    console.log('Student 1: student1@example.com / password123 (belongs to Instructor 1)');
    console.log('Student 2: student2@example.com / password123 (belongs to Instructor 2)');
  } else {
    // Ensure a friendly demo instructor account always exists
    const hasInstructor = users.some(u => u.email === 'instructor@example.com');
    if (!hasInstructor) {
      const instructor: MockUser = {
        id: 'instructor-instructor',
        email: 'instructor@example.com',
        password: 'Password123',
        name: 'Instructor',
        role: 'instructor',
        created_at: new Date().toISOString(),
      };
      const updated = [...users, instructor];
      await saveMockUsers(updated);
      console.log('🆕 Added default instructor account: instructor@example.com / Password123');
    }
  }
};

// Initialize mock data
initializeMockData().then(() => {
  console.log('🚀 Mock data initialization completed');
}).catch(error => {
  console.error('❌ Mock data initialization failed:', error);
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'instructor' | 'student';
          instructor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'instructor' | 'student';
          instructor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'instructor' | 'student';
          instructor_id?: string | null;
          created_at?: string;
        };
      };
      evaluations: {
        Row: {
          id: string;
          student_id: string;
          instructor_id: string;
          date: string;
          score: number;
          feedback: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          instructor_id: string;
          date?: string;
          score: number;
          feedback: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          instructor_id?: string;
          date?: string;
          score?: number;
          feedback?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          student_id: string;
          instructor_id: string;
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          instructor_id: string;
          title: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          instructor_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
};