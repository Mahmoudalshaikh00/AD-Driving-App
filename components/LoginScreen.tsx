import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { User, UserPlus, Lock, Mail, Shield } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuthStore';
import Colors from '@/constants/colors';

type LoginMode = 'select' | 'instructor' | 'student' | 'admin' | 'signup';

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string): boolean => {
    return email.includes('@');
  };

  const validatePassword = (password: string): boolean => {
    return password.length > 0 && password[0] === password[0].toUpperCase() && password[0] !== password[0].toLowerCase();
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email must contain "@" symbol');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must start with a capital letter');
      return;
    }

    if (mode === 'admin') {
      if (email !== 'mahmoud200276@gmail.com' || password !== 'Liverpool9876') {
        setError('Invalid admin credentials');
        return;
      }
    }

    setIsLoading(true);
    setError('');
    
    const result = await signIn(email, password);
    
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email must contain "@" symbol');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must start with a capital letter');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const result = await signUp(email, password, name, 'instructor');
    
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.error || 'Sign up failed');
    } else {
      Alert.alert('Success', 'Account created successfully! Please sign in.');
      setMode('instructor');
      setEmail('');
      setPassword('');
      setName('');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Lock size={64} color={Colors.light.primary} />
          </View>
          
          <Text style={styles.title}>AD Driving</Text>
          <Text style={styles.subtitle}>Professional Driving Instructor App</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => {
                resetForm();
                setMode('instructor');
              }}
              testID="instructor-button"
            >
              <User size={24} color={Colors.light.primary} />
              <Text style={styles.roleButtonText}>I&apos;m an Instructor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.roleButton}
              onPress={() => {
                resetForm();
                setMode('student');
              }}
              testID="student-button"
            >
              <UserPlus size={24} color={Colors.light.primary} />
              <Text style={styles.roleButtonText}>I&apos;m a Student</Text>
            </TouchableOpacity>
            

          </View>
          

        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {mode === 'instructor' || mode === 'signup' ? (
              <User size={64} color={Colors.light.primary} />
            ) : mode === 'admin' ? (
              <Shield size={64} color={Colors.light.primary} />
            ) : (
              <UserPlus size={64} color={Colors.light.primary} />
            )}
          </View>
          
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create Instructor Account' : 
             mode === 'instructor' ? 'Instructor Login' : 
             mode === 'admin' ? 'Admin Panel' : 'Student Login'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' ? 'Sign up as a new instructor' :
             mode === 'admin' ? 'Access administrative functions' :
             'Enter your credentials to continue'}
          </Text>
          
          <View style={styles.inputContainer}>
            {mode === 'signup' && (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  autoCapitalize="words"
                  testID="name-input"
                />
              </View>
            )}
            
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                testID="email-input"
              />
            </View>
            
            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.light.tabIconDefault} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={Colors.light.tabIconDefault}
                secureTextEntry
                testID="password-input"
              />
            </View>
          </View>
          
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
          
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled
            ]}
            onPress={mode === 'signup' ? handleSignUp : handleSignIn}
            disabled={isLoading}
            testID="submit-button"
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Please wait...' : 
               mode === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          {mode === 'instructor' && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => {
                resetForm();
                setMode('signup');
              }}
              testID="signup-link"
            >
              <Text style={styles.linkText}>
                New instructor? Create an account
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              resetForm();
              setMode('select');
            }}
            testID="back-button"
          >
            <Text style={styles.linkText}>← Back to role selection</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: Colors.light.tabIconDefault,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    color: Colors.light.primary,
    fontSize: 14,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 16,
  },
});