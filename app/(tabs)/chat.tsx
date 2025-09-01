import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import Colors from '@/constants/colors';
import { ImagePlus, File, Send, NotebookPen, ChevronLeft, MessageSquare } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuthStore';
import { ChatMessage, MessageAttachment } from '@/types';
import * as ImagePicker from 'expo-image-picker';
import { useStudentStore } from '@/hooks/useStudentStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/lib/supabase';
import { useNotificationStore } from '@/hooks/useNotificationStore';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Global chat store with Supabase integration
const [ChatProvider, useChatStore] = createContextHook(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { sendMessageNotification } = useNotificationStore();
  
  const fetchMessages = useCallback(async (studentId: string, trainerId: string) => {
    if (!studentId || !trainerId) return;
    
    setLoading(true);
    try {
      console.log('📨 Fetching messages for student:', studentId, 'trainer:', trainerId);
      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('student_id', studentId)
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false });
      
      const { data, error } = await new Promise<any>((resolve) => {
        query.then(resolve);
      });
      
      if (error) {
        console.error('❌ Error fetching messages:', error);
        // If table doesn't exist, create it silently
        if (error.message?.includes('relation "chat_messages" does not exist')) {
          console.log('📋 Chat messages table does not exist, using local storage');
          setMessages([]);
        }
      } else {
        console.log('✅ Messages fetched:', data?.length || 0);
        setMessages(data as ChatMessage[] || []);
      }
    } catch (error) {
      console.error('🚨 Error in fetchMessages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const addMessage = useCallback(async (message: ChatMessage, senderName?: string, recipientId?: string) => {
    console.log('📤 Adding message:', message);
    
    // Add to local state immediately for optimistic update
    setMessages(prev => [message, ...prev]);
    
    try {
      // Try to save to database
      const query = supabase
        .from('chat_messages')
        .insert(message);
      
      const { error } = await new Promise<any>((resolve) => {
        query.then(resolve);
      });
      
      if (error) {
        console.error('❌ Error saving message to database:', error);
        // If table doesn't exist, we'll just keep it in local state
        if (!error.message?.includes('relation "chat_messages" does not exist')) {
          // If it's a different error, remove from local state
          setMessages(prev => prev.filter(m => m.id !== message.id));
        }
      } else {
        console.log('✅ Message saved to database');
      }
      
      // Send notification to recipient
      if (senderName && recipientId && message.text) {
        const messagePreview = message.text.length > 50 
          ? message.text.substring(0, 50) + '...' 
          : message.text;
        
        await sendMessageNotification(
          recipientId,
          senderName,
          messagePreview,
          `/chat/${message.student_id}`
        );
      }
    } catch (error) {
      console.error('🚨 Error in addMessage:', error);
    }
  }, [sendMessageNotification]);
  
  const getMessagesForChat = useCallback((studentId: string, trainerId: string) => {
    return messages.filter(m => 
      m.student_id === studentId && m.trainer_id === trainerId
    );
  }, [messages]);
  
  return {
    messages,
    loading,
    addMessage,
    getMessagesForChat,
    fetchMessages
  };
});

function ChatScreenContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { students } = useStudentStore();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const insets = useSafeAreaInsets();
  const { addMessage, getMessagesForChat, fetchMessages, loading: chatLoading } = useChatStore();
  const { markAsReadByStudentAndType } = useNotificationStore();
  const [text, setText] = useState<string>('');
  const [isReportMode, setIsReportMode] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const isTrainer = user?.role === 'trainer';
  const activeStudentId = isTrainer ? selectedStudentId : (user?.id ?? '');
  const trainerId = user?.role === 'trainer' ? user.id : (user?.trainer_id ?? '');

  // Auto-select student when coming from student details
  useEffect(() => {
    const pid = typeof params.studentId === 'string' ? params.studentId : undefined;
    if (isTrainer && pid) {
      setSelectedStudentId(pid);
    }
  }, [params.studentId, isTrainer]);

  // Fetch messages when chat participants are determined
  useEffect(() => {
    if (activeStudentId && trainerId) {
      console.log('🔄 Fetching messages for chat:', { activeStudentId, trainerId });
      fetchMessages(activeStudentId, trainerId);
      
      // Mark message notifications as read when entering chat
      if (isTrainer) {
        markAsReadByStudentAndType(activeStudentId, 'message');
      } else {
        markAsReadByStudentAndType(trainerId, 'message');
      }
    }
  }, [activeStudentId, trainerId, fetchMessages, markAsReadByStudentAndType, isTrainer]);

  const filtered = useMemo(() => {
    if (!activeStudentId || !trainerId) return [] as ChatMessage[];
    return getMessagesForChat(activeStudentId, trainerId);
  }, [activeStudentId, trainerId, getMessagesForChat]);

  const selectedStudent = useMemo(() => {
    if (!isTrainer || !selectedStudentId) return null;
    return students.find(s => s.id === selectedStudentId);
  }, [isTrainer, selectedStudentId, students]);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
      if (!res.canceled) {
        const uri = res.assets?.[0]?.uri ?? '';
        const att: MessageAttachment = { id: uid(), type: 'image', url: uri };
        sendMessage('', [att]);
      }
    } catch (e) {
      console.log('pick image error', e);
    }
  };

  const sendMessage = async (txt?: string, attachments?: MessageAttachment[]) => {
    if (!user || !trainerId || !activeStudentId) {
      console.log('Cannot send message - missing user, trainer or student ID');
      return;
    }
    
    const messageText = txt ?? text;
    if (!messageText.trim() && !attachments?.length && !isReportMode) {
      console.log('Cannot send empty message');
      return;
    }
    
    const message: ChatMessage = {
      id: uid(),
      student_id: activeStudentId,
      trainer_id: trainerId,
      sender_id: user.id,
      text: messageText || undefined,
      attachments: attachments?.length ? attachments : undefined,
      created_at: new Date().toISOString(),
      isReport: isReportMode || undefined,
      reportTitle: isReportMode ? (reportTitle || 'Lesson Report') : undefined,
    };
    
    console.log('Sending message:', message);
    
    // Determine recipient and sender info for notifications
    const recipientId = isTrainer ? activeStudentId : trainerId;
    const senderName = user.name;
    
    await addMessage(message, senderName, recipientId);
    setText('');
    setIsReportMode(false);
    setReportTitle('');
    
    // Scroll to top (newest message) after sending
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.topHeader, { paddingTop: Math.max(10, insets.top + 6) }]} testID="chat-header">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} testID="chat-back" accessibilityLabel="Back">
          <ChevronLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {isTrainer && selectedStudent ? (
            <>
              <Text style={styles.headerTitle}>{selectedStudent.name}</Text>
              <Text style={styles.headerSubtitle}>Student</Text>
            </>
          ) : !isTrainer ? (
            <>
              <Text style={styles.headerTitle}>Chat</Text>
              <Text style={styles.headerSubtitle}>with your trainer</Text>
            </>
          ) : (
            <Text style={styles.headerTitle}>Chat</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>
      
      {isTrainer && !selectedStudent && (
        <View style={styles.contentCard}>
          <Text style={styles.selectorLabel}>Select Student</Text>
          <FlatList
            horizontal
            data={students}
            keyExtractor={(s) => s.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.studentList}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedStudentId(item.id)}
                style={[
                  styles.studentChip,
                  selectedStudentId === item.id && styles.studentChipActive
                ]}
                testID={`chat-student-chip-${item.id}`}
              >
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitial}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[
                  styles.studentName,
                  selectedStudentId === item.id && styles.studentNameActive
                ]}>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyStudents}>
                <Text style={styles.emptyText}>No students available</Text>
              </View>
            }
          />
        </View>
      )}

      <View style={styles.chatContainer}>
        {!activeStudentId ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <MessageSquare size={48} color={Colors.light.primary} />
            </View>
            <Text style={styles.welcomeTitle}>
              {isTrainer ? 'Select a student to start chatting' : 'Welcome to Chat'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {isTrainer 
                ? 'Choose a student from the list above to begin your conversation'
                : 'Connect with your trainer and share your progress'
              }
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              ref={flatListRef}
              inverted
              data={filtered}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[styles.messageContainer, item.sender_id === user?.id ? styles.myMessage : styles.theirMessage]} testID="chat-message">
                  <View style={[styles.messageBubble, item.sender_id === user?.id ? styles.myBubble : styles.theirBubble]}>
                    {item.isReport && (
                      <View style={styles.reportHeader}>
                        <NotebookPen size={14} color={item.sender_id === user?.id ? '#fff' : Colors.light.primary} />
                        <Text style={[styles.reportTitle, item.sender_id !== user?.id && { color: Colors.light.primary }]}>{item.reportTitle}</Text>
                      </View>
                    )}
                    {item.text && <Text style={[styles.messageText, item.sender_id !== user?.id && { color: Colors.light.text }]}>{item.text}</Text>}
                    {item.attachments?.map((att: MessageAttachment) => (
                      att.type === 'image' ? (
                        <Image key={att.id} source={{ uri: att.url }} style={styles.messageImage} />
                      ) : (
                        <View key={att.id} style={styles.fileAttachment}>
                          <File size={16} color={item.sender_id === user?.id ? '#fff' : Colors.light.primary} />
                          <Text numberOfLines={1} style={[styles.fileName, item.sender_id !== user?.id && { color: Colors.light.text }]}>{att.name ?? 'File'}</Text>
                        </View>
                      )
                    ))}
                  </View>
                  <Text style={[styles.messageTime, item.sender_id === user?.id ? styles.myTime : styles.theirTime]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Text style={styles.emptyText}>No messages yet</Text>
                  <Text style={styles.emptySubtext}>Start the conversation!</Text>
                </View>
              }
            />

            {isTrainer && (
              <View style={styles.reportToggle}>
                <TouchableOpacity 
                  style={[styles.reportButton, isReportMode && styles.reportButtonActive]} 
                  onPress={() => setIsReportMode(v => !v)} 
                  testID="toggle-report"
                >
                  <NotebookPen size={16} color={isReportMode ? '#fff' : Colors.light.primary} />
                  <Text style={[styles.reportButtonText, isReportMode && styles.reportButtonTextActive]}>Lesson Report</Text>
                </TouchableOpacity>
                {isReportMode && (
                  <TextInput
                    value={reportTitle}
                    onChangeText={setReportTitle}
                    placeholder="Report title (optional)"
                    placeholderTextColor={Colors.light.textLight}
                    style={styles.reportTitleInput}
                    testID="report-title"
                  />
                )}
              </View>
            )}

            <View style={[styles.inputContainer, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
              <TouchableOpacity style={styles.attachButton} onPress={pickImage} testID="attach-image">
                <ImagePlus size={20} color={Colors.light.primary} />
              </TouchableOpacity>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={isReportMode ? 'Write your lesson report...' : 'Type a message...'}
                placeholderTextColor={Colors.light.textLight}
                style={styles.messageInput}
                multiline
                maxLength={1000}
                testID="message-input"
                returnKeyType="send"
                onSubmitEditing={async () => {
                  if (text.trim() || isReportMode) {
                    await sendMessage();
                  }
                }}
                blurOnSubmit={false}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!text.trim() && !isReportMode) && styles.sendButtonDisabled]} 
                onPress={async () => await sendMessage()} 
                disabled={!activeStudentId || (!text.trim() && !isReportMode)} 
                testID="send"
              >
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  return (
    <ChatProvider>
      <ChatScreenContent />
    </ChatProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.light.background 
  },
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: Colors.light.primary, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  contentCard: {
    margin: 16,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
  studentList: {
    paddingHorizontal: 4,
  },
  studentChip: {
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
  },
  studentChipActive: {
    backgroundColor: '#e8f1ff',
    borderColor: Colors.light.primary,
  },
  studentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  studentInitial: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  studentName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  studentNameActive: {
    color: Colors.light.primary,
  },
  emptyStudents: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: Colors.light.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 6,
  },
  theirBubble: {
    backgroundColor: Colors.light.cardBackground,
    borderBottomLeftRadius: 6,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginTop: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myTime: {
    color: Colors.light.textLight,
    textAlign: 'right',
  },
  theirTime: {
    color: Colors.light.textLight,
    textAlign: 'left',
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
  },
  reportToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.light.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  reportButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  reportButtonTextActive: {
    color: '#fff',
  },
  reportTitleInput: {
    marginTop: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: Colors.light.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.light.textLight,
    opacity: 0.5,
  },
});