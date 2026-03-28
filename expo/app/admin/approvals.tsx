import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { CheckCircle, XCircle, Clock, Search, User, Mail, Phone, Calendar, FileText, Award, MapPin, Star } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface PendingApproval {
  id: string;
  name: string;
  email: string;
  phone?: string;
  experience: string;
  certifications: string[];
  submittedAt: string;
  status: ApprovalStatus;
  adminNotes?: string;
  location?: string;
  rating?: number;
  documents?: {
    license?: string;
    certification?: string;
    background_check?: string;
    insurance?: string;
  };
}

export default function AdminApprovalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | 'all'>('all');
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  useEffect(() => {
    // Enhanced mock approvals data
    const mockApprovals: PendingApproval[] = [
      {
        id: '1',
        name: 'David Martinez',
        email: 'david.martinez@example.com',
        phone: '+1234567890',
        experience: '5 years of professional driving instruction with specialization in defensive driving techniques. Previously worked at Premier Driving Academy and has experience with both manual and automatic vehicles. Certified in teaching nervous drivers and has a 98% first-time pass rate.',
        certifications: ['Certified Driving Instructor (CDI)', 'First Aid Certified', 'Defensive Driving Specialist'],
        submittedAt: '2024-01-20T09:30:00Z',
        status: 'approved',
        adminNotes: 'Excellent credentials and experience. Auto-approved by system with outstanding qualifications.',
        location: 'Los Angeles, CA',
        rating: 4.9,
        documents: {
          license: 'driving_license_david.pdf',
          certification: 'cdi_certificate_david.pdf',
          background_check: 'background_check_david.pdf',
          insurance: 'insurance_david.pdf'
        }
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '+1234567891',
        experience: '3 years teaching at XYZ Driving Academy with focus on teen drivers. Experience with both manual and automatic vehicles. Specialized in parallel parking and highway driving instruction.',
        certifications: ['Licensed Driving Instructor', 'Vehicle Safety Inspector', 'Teen Driver Specialist'],
        submittedAt: '2024-01-19T14:15:00Z',
        status: 'approved',
        adminNotes: 'Good experience with teen drivers. Auto-approved by system.',
        location: 'San Francisco, CA',
        rating: 4.7,
        documents: {
          license: 'driving_license_michael.pdf',
          certification: 'instructor_license_michael.pdf',
          background_check: 'background_check_michael.pdf'
        }
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        phone: '+1234567892',
        experience: '7 years of comprehensive driving instruction including commercial vehicle training. Former DMV examiner with extensive knowledge of current driving laws and regulations. Fluent in English and Spanish.',
        certifications: ['Master Driving Instructor', 'Commercial Vehicle Instructor', 'DMV Examiner Certification', 'Bilingual Instructor'],
        submittedAt: '2024-01-18T11:45:00Z',
        status: 'approved',
        adminNotes: 'Outstanding credentials and former DMV examiner. Approved for all vehicle types including commercial.',
        location: 'Phoenix, AZ',
        rating: 5.0,
        documents: {
          license: 'driving_license_emily.pdf',
          certification: 'master_instructor_emily.pdf',
          background_check: 'background_check_emily.pdf',
          insurance: 'commercial_insurance_emily.pdf'
        }
      },
      {
        id: '4',
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        phone: '+1234567893',
        experience: '1 year experience as assistant instructor. Recently completed instructor training program at Metro Driving School. Eager to start independent instruction.',
        certifications: ['Basic Driving Instructor', 'CPR Certified'],
        submittedAt: '2024-01-17T16:20:00Z',
        status: 'pending',
        location: 'Seattle, WA',
        documents: {
          license: 'driving_license_james.pdf',
          certification: 'basic_instructor_james.pdf'
        }
      },
      {
        id: '5',
        name: 'Maria Gonzalez',
        email: 'maria.gonzalez@example.com',
        phone: '+1234567894',
        experience: '4 years of driving instruction with focus on senior citizens and drivers with disabilities. Certified in adaptive driving techniques and patient instruction methods.',
        certifications: ['Certified Driving Instructor', 'Adaptive Driving Specialist', 'Senior Driver Instructor', 'Disability Awareness Certified'],
        submittedAt: '2024-01-21T10:15:00Z',
        status: 'pending',
        location: 'Miami, FL',
        documents: {
          license: 'driving_license_maria.pdf',
          certification: 'adaptive_specialist_maria.pdf',
          background_check: 'background_check_maria.pdf'
        }
      }
    ];
    setApprovals(mockApprovals);
  }, []);

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         approval.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (approval.location && approval.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || approval.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprovalAction = (approvalId: string, action: 'approve' | 'reject') => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return;

    const actionText = action === 'approve' ? 'Approve' : 'Reject';
    const message = action === 'approve' 
      ? `Approve ${approval.name} as an instructor?`
      : `Reject ${approval.name}'s application?`;

    Alert.prompt(
      `${actionText} Application`,
      `${message}\n\nAdd admin notes (optional):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: (notes) => {
            const newStatus: ApprovalStatus = action === 'approve' ? 'approved' : 'rejected';
            setApprovals(prev => prev.map(a => 
              a.id === approvalId 
                ? { 
                    ...a, 
                    status: newStatus,
                    adminNotes: notes || a.adminNotes
                  }
                : a
            ));
            
            const successMessage = action === 'approve'
              ? `${approval.name} has been approved as an instructor and can now start teaching.`
              : `${approval.name}'s application has been rejected.`;
            
            Alert.alert('Success', successMessage);
          }
        }
      ],
      'plain-text',
      approval.adminNotes
    );
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return Colors.light.textLight;
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'approved': return <CheckCircle size={16} color="#10b981" />;
      case 'rejected': return <XCircle size={16} color="#ef4444" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ApprovalCard = ({ approval }: { approval: PendingApproval }) => (
    <TouchableOpacity 
      style={[
        styles.approvalCard,
        approval.status === 'pending' && styles.pendingCard
      ]}
      onPress={() => setSelectedApproval(approval)}
    >
      <View style={styles.approvalHeader}>
        <View style={styles.approvalIcon}>
          <User size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.approvalInfo}>
          <Text style={styles.approvalName}>{approval.name}</Text>
          <Text style={styles.approvalEmail}>{approval.email}</Text>
          <View style={styles.approvalMeta}>
            {approval.location && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={Colors.light.textLight} />
                <Text style={styles.metaText}>{approval.location}</Text>
              </View>
            )}
            {approval.rating && (
              <View style={styles.metaItem}>
                <Star size={12} color="#f59e0b" />
                <Text style={styles.metaText}>{approval.rating}/5.0</Text>
              </View>
            )}
          </View>
          <Text style={styles.approvalDate}>
            Submitted: {formatDate(approval.submittedAt)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(approval.status)}
          <Text style={[styles.statusText, { color: getStatusColor(approval.status) }]}>
            {approval.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.experiencePreview} numberOfLines={2}>
        {approval.experience}
      </Text>
      
      <View style={styles.certificationsContainer}>
        <Text style={styles.certificationsLabel}>Certifications ({approval.certifications.length}):</Text>
        <Text style={styles.certificationsText} numberOfLines={1}>
          {approval.certifications.join(', ')}
        </Text>
      </View>
      
      {approval.status === 'pending' && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#10b981' + '15' }]}
            onPress={() => handleApprovalAction(approval.id, 'approve')}
          >
            <CheckCircle size={14} color="#10b981" />
            <Text style={[styles.quickActionText, { color: '#10b981' }]}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#ef4444' + '15' }]}
            onPress={() => handleApprovalAction(approval.id, 'reject')}
          >
            <XCircle size={14} color="#ef4444" />
            <Text style={[styles.quickActionText, { color: '#ef4444' }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const FilterButton = ({ title, isSelected, onPress }: { title: string; isSelected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterButton, isSelected && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (selectedApproval) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedApproval(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Application Details</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.applicantInfo}>
                <Text style={styles.applicantName}>{selectedApproval.name}</Text>
                <View style={styles.statusContainer}>
                  {getStatusIcon(selectedApproval.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(selectedApproval.status) }]}>
                    {selectedApproval.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {selectedApproval.rating && (
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>{selectedApproval.rating}/5.0</Text>
                </View>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              <View style={styles.contactInfo}>
                <Mail size={16} color={Colors.light.textLight} />
                <Text style={styles.contactText}>{selectedApproval.email}</Text>
              </View>
              {selectedApproval.phone && (
                <View style={styles.contactInfo}>
                  <Phone size={16} color={Colors.light.textLight} />
                  <Text style={styles.contactText}>{selectedApproval.phone}</Text>
                </View>
              )}
              {selectedApproval.location && (
                <View style={styles.contactInfo}>
                  <MapPin size={16} color={Colors.light.textLight} />
                  <Text style={styles.contactText}>{selectedApproval.location}</Text>
                </View>
              )}
              <View style={styles.contactInfo}>
                <Calendar size={16} color={Colors.light.textLight} />
                <Text style={styles.contactText}>Submitted: {formatDate(selectedApproval.submittedAt)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Experience & Background</Text>
              <Text style={styles.experienceText}>{selectedApproval.experience}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Certifications & Qualifications</Text>
              {selectedApproval.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Award size={14} color="#10b981" />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>

            {selectedApproval.documents && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Submitted Documents</Text>
                {Object.entries(selectedApproval.documents).map(([type, filename]) => (
                  <TouchableOpacity key={type} style={styles.documentItem}>
                    <FileText size={16} color={Colors.light.primary} />
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentType}>{type.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.documentName}>{filename}</Text>
                    </View>
                    <Text style={styles.viewDocument}>View</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedApproval.adminNotes && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Admin Notes</Text>
                <Text style={styles.notesText}>{selectedApproval.adminNotes}</Text>
              </View>
            )}

            {selectedApproval.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                  onPress={() => handleApprovalAction(selectedApproval.id, 'approve')}
                >
                  <CheckCircle size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Approve Application</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleApprovalAction(selectedApproval.id, 'reject')}
                >
                  <XCircle size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Reject Application</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Applications</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search applications..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.light.textLight}
        />
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Status:</Text>
        <View style={styles.filterRow}>
          <FilterButton title="All" isSelected={selectedStatus === 'all'} onPress={() => setSelectedStatus('all')} />
          <FilterButton title="Pending" isSelected={selectedStatus === 'pending'} onPress={() => setSelectedStatus('pending')} />
          <FilterButton title="Approved" isSelected={selectedStatus === 'approved'} onPress={() => setSelectedStatus('approved')} />
          <FilterButton title="Rejected" isSelected={selectedStatus === 'rejected'} onPress={() => setSelectedStatus('rejected')} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredApprovals.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredApprovals.filter(a => a.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredApprovals.filter(a => a.status === 'approved').length}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredApprovals.filter(a => a.status === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      <FlatList
        data={filteredApprovals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ApprovalCard approval={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={48} color={Colors.light.textLight} />
            <Text style={styles.emptyText}>No applications found</Text>
            <Text style={styles.emptySubtext}>New instructor applications will appear here for review</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.light.cardBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: Colors.light.textLight,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginTop: 4,
  },
  approvalCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  approvalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  approvalEmail: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 6,
  },
  approvalMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  approvalDate: {
    fontSize: 12,
    color: Colors.light.textLight,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  experiencePreview: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  certificationsContainer: {
    marginBottom: 12,
  },
  certificationsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  certificationsText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  detailCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  detailHeader: {
    marginBottom: 20,
  },
  applicantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b' + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  experienceText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: Colors.light.background,
    padding: 8,
    borderRadius: 8,
  },
  certificationText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  documentName: {
    fontSize: 14,
    color: Colors.light.text,
  },
  viewDocument: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textLight,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});