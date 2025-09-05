import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { CheckCircle, XCircle, Clock, Search, User, Mail, Phone, Calendar, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

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
  documents?: {
    license?: string;
    certification?: string;
    background_check?: string;
  };
}

export default function AdminApprovalsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | 'all'>('pending');
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);

  useEffect(() => {
    // Mock approvals data - in real app, fetch from API
    const mockApprovals: PendingApproval[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1234567890',
        experience: '5 years of professional driving instruction with ABC Driving School. Specialized in nervous drivers and highway training.',
        certifications: ['Certified Driving Instructor (CDI)', 'Defensive Driving Instructor', 'First Aid Certified'],
        submittedAt: '2024-01-20T09:30:00Z',
        status: 'pending',
        documents: {
          license: 'driving_license_sarah.pdf',
          certification: 'cdi_certificate_sarah.pdf',
          background_check: 'background_check_sarah.pdf'
        }
      },
      {
        id: '2',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '+1234567891',
        experience: '3 years teaching at XYZ Driving Academy. Experience with both manual and automatic vehicles.',
        certifications: ['Licensed Driving Instructor', 'Vehicle Safety Inspector'],
        submittedAt: '2024-01-19T14:15:00Z',
        status: 'pending',
        documents: {
          license: 'driving_license_michael.pdf',
          certification: 'instructor_license_michael.pdf'
        }
      },
      {
        id: '3',
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        phone: '+1234567892',
        experience: '7 years of experience including commercial vehicle instruction. Former DMV examiner.',
        certifications: ['Master Driving Instructor', 'Commercial Vehicle Instructor', 'DMV Examiner Certification'],
        submittedAt: '2024-01-18T11:45:00Z',
        status: 'approved',
        adminNotes: 'Excellent credentials and experience. Approved for all vehicle types.',
        documents: {
          license: 'driving_license_emily.pdf',
          certification: 'master_instructor_emily.pdf',
          background_check: 'background_check_emily.pdf'
        }
      },
      {
        id: '4',
        name: 'James Wilson',
        email: 'james.wilson@example.com',
        experience: '1 year experience. Recently completed instructor training program.',
        certifications: ['Basic Driving Instructor'],
        submittedAt: '2024-01-17T16:20:00Z',
        status: 'rejected',
        adminNotes: 'Insufficient experience. Recommend gaining more practical experience before reapplying.',
      },
    ];
    setApprovals(mockApprovals);
  }, []);

  const filteredApprovals = approvals.filter(approval => {
    const matchesSearch = approval.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         approval.email.toLowerCase().includes(searchQuery.toLowerCase());
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
              ? `${approval.name} has been approved as an instructor.`
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
      style={styles.approvalCard}
      onPress={() => setSelectedApproval(approval)}
    >
      <View style={styles.approvalHeader}>
        <View style={styles.approvalIcon}>
          <User size={20} color={Colors.light.primary} />
        </View>
        <View style={styles.approvalInfo}>
          <Text style={styles.approvalName}>{approval.name}</Text>
          <Text style={styles.approvalEmail}>{approval.email}</Text>
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
        <Text style={styles.certificationsLabel}>Certifications:</Text>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedApproval(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Application Details</Text>
        </View>

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
            <View style={styles.contactInfo}>
              <Calendar size={16} color={Colors.light.textLight} />
              <Text style={styles.contactText}>Submitted: {formatDate(selectedApproval.submittedAt)}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <Text style={styles.experienceText}>{selectedApproval.experience}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {selectedApproval.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <CheckCircle size={14} color="#10b981" />
                <Text style={styles.certificationText}>{cert}</Text>
              </View>
            ))}
          </View>

          {selectedApproval.documents && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Documents</Text>
              {Object.entries(selectedApproval.documents).map(([type, filename]) => (
                <TouchableOpacity key={type} style={styles.documentItem}>
                  <Text style={styles.documentType}>{type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.documentName}>{filename}</Text>
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
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                onPress={() => handleApprovalAction(selectedApproval.id, 'reject')}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Instructor Approvals</Text>
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
          <FilterButton title="Pending" isSelected={selectedStatus === 'pending'} onPress={() => setSelectedStatus('pending')} />
          <FilterButton title="All" isSelected={selectedStatus === 'all'} onPress={() => setSelectedStatus('all')} />
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
    marginBottom: 4,
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
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
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
  },
  applicantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
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
  },
  certificationText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  documentItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textLight,
    marginBottom: 4,
  },
  documentName: {
    fontSize: 14,
    color: Colors.light.text,
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
});