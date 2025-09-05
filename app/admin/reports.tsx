import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { AlertTriangle, Search, Eye, CheckCircle, XCircle, Clock, User, MessageSquare, Calendar, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
type ReportType = 'harassment' | 'inappropriate_content' | 'spam' | 'safety_concern' | 'other';

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    // Enhanced mock reports data with more realistic scenarios
    const mockReports: Report[] = [
      {
        id: '1',
        reporterId: 'student1',
        reporterName: 'Alice Johnson',
        reportedUserId: 'instructor2',
        reportedUserName: 'Bob Smith',
        type: 'inappropriate_content',
        description: 'Instructor made inappropriate comments during the lesson and used unprofessional language.',
        status: 'pending',
        createdAt: '2024-01-20T10:30:00Z',
        severity: 'high'
      },
      {
        id: '2',
        reporterId: 'student2',
        reporterName: 'Charlie Brown',
        reportedUserId: 'instructor1',
        reportedUserName: 'David Wilson',
        type: 'safety_concern',
        description: 'Instructor was driving recklessly during the lesson, speeding and making unsafe lane changes. Made me feel very unsafe.',
        status: 'investigating',
        createdAt: '2024-01-19T14:15:00Z',
        updatedAt: '2024-01-19T16:00:00Z',
        adminNotes: 'Contacted both parties for more information. Reviewing driving records.',
        severity: 'critical'
      },
      {
        id: '3',
        reporterId: 'instructor3',
        reporterName: 'Emma Davis',
        reportedUserId: 'student3',
        reportedUserName: 'Frank Miller',
        type: 'harassment',
        description: 'Student has been sending inappropriate messages and making unwanted advances. Has continued despite being asked to stop.',
        status: 'resolved',
        createdAt: '2024-01-18T09:45:00Z',
        updatedAt: '2024-01-19T11:30:00Z',
        adminNotes: 'Student account suspended for 30 days. Warning issued. Monitoring for future incidents.',
        severity: 'high'
      },
      {
        id: '4',
        reporterId: 'student4',
        reporterName: 'Grace Lee',
        reportedUserId: 'instructor4',
        reportedUserName: 'Henry Taylor',
        type: 'spam',
        description: 'Instructor keeps sending promotional messages for other services and trying to conduct business outside the platform.',
        status: 'dismissed',
        createdAt: '2024-01-17T16:20:00Z',
        updatedAt: '2024-01-18T10:00:00Z',
        adminNotes: 'Reviewed messages. Content was within acceptable promotional guidelines. Advised instructor on platform policies.',
        severity: 'low'
      },
      {
        id: '5',
        reporterId: 'student5',
        reporterName: 'Ivan Rodriguez',
        reportedUserId: 'instructor5',
        reportedUserName: 'Julia Martinez',
        type: 'safety_concern',
        description: 'Instructor arrived to lesson under the influence of alcohol. Could smell alcohol on their breath.',
        status: 'investigating',
        createdAt: '2024-01-21T08:30:00Z',
        updatedAt: '2024-01-21T09:00:00Z',
        adminNotes: 'URGENT: Instructor suspended immediately pending investigation. Police report filed.',
        severity: 'critical'
      },
      {
        id: '6',
        reporterId: 'instructor6',
        reporterName: 'Kevin Park',
        reportedUserId: 'student6',
        reportedUserName: 'Lisa Wong',
        type: 'other',
        description: 'Student consistently shows up late and unprepared for lessons. Has missed 3 lessons without notice.',
        status: 'pending',
        createdAt: '2024-01-20T15:45:00Z',
        severity: 'medium'
      }
    ];
    setReports(mockReports);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.reportedUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesType = selectedType === 'all' || report.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleReportAction = (reportId: string, action: 'investigate' | 'resolve' | 'dismiss') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    let newStatus: ReportStatus;
    let message: string;

    switch (action) {
      case 'investigate':
        newStatus = 'investigating';
        message = 'Report marked as under investigation.';
        break;
      case 'resolve':
        newStatus = 'resolved';
        message = 'Report marked as resolved.';
        break;
      case 'dismiss':
        newStatus = 'dismissed';
        message = 'Report dismissed.';
        break;
    }

    Alert.prompt(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Report`,
      'Add admin notes (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: (notes) => {
            setReports(prev => prev.map(r => 
              r.id === reportId 
                ? { 
                    ...r, 
                    status: newStatus, 
                    updatedAt: new Date().toISOString(),
                    adminNotes: notes || r.adminNotes
                  }
                : r
            ));
            Alert.alert('Success', message);
          }
        }
      ],
      'plain-text',
      report.adminNotes
    );
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'investigating': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return Colors.light.textLight;
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'pending': return <Clock size={16} color="#f59e0b" />;
      case 'investigating': return <Eye size={16} color="#3b82f6" />;
      case 'resolved': return <CheckCircle size={16} color="#10b981" />;
      case 'dismissed': return <XCircle size={16} color="#6b7280" />;
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return Colors.light.textLight;
    }
  };

  const getTypeColor = (type: ReportType) => {
    switch (type) {
      case 'harassment': return '#ef4444';
      case 'inappropriate_content': return '#f97316';
      case 'spam': return '#8b5cf6';
      case 'safety_concern': return '#dc2626';
      case 'other': return '#6b7280';
      default: return Colors.light.textLight;
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

  const ReportCard = ({ report }: { report: Report }) => (
    <TouchableOpacity 
      style={[
        styles.reportCard,
        report.severity === 'critical' && styles.criticalReport
      ]}
      onPress={() => setSelectedReport(report)}
    >
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <AlertTriangle size={20} color={getTypeColor(report.type)} />
        </View>
        <View style={styles.reportInfo}>
          <View style={styles.reportTitleRow}>
            <Text style={styles.reportTitle}>
              {report.type.replace('_', ' ').toUpperCase()}
            </Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) + '15' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(report.severity) }]}>
                {report.severity.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.reportUsers}>
            {report.reporterName} → {report.reportedUserName}
          </Text>
          <Text style={styles.reportDate}>
            {formatDate(report.createdAt)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(report.status)}
          <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
            {report.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.reportDescription} numberOfLines={2}>
        {report.description}
      </Text>
      
      {report.status === 'pending' && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#3b82f6' + '15' }]}
            onPress={() => handleReportAction(report.id, 'investigate')}
          >
            <Eye size={14} color="#3b82f6" />
            <Text style={[styles.quickActionText, { color: '#3b82f6' }]}>Investigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#10b981' + '15' }]}
            onPress={() => handleReportAction(report.id, 'resolve')}
          >
            <CheckCircle size={14} color="#10b981" />
            <Text style={[styles.quickActionText, { color: '#10b981' }]}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: '#6b7280' + '15' }]}
            onPress={() => handleReportAction(report.id, 'dismiss')}
          >
            <XCircle size={14} color="#6b7280" />
            <Text style={[styles.quickActionText, { color: '#6b7280' }]}>Dismiss</Text>
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

  if (selectedReport) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Report Details</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.typeTag, { backgroundColor: getTypeColor(selectedReport.type) + '15' }]}>
              <Text style={[styles.typeTagText, { color: getTypeColor(selectedReport.type) }]}>
                {selectedReport.type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedReport.severity) + '15' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(selectedReport.severity) }]}>
                {selectedReport.severity.toUpperCase()}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              {getStatusIcon(selectedReport.status)}
              <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>
                {selectedReport.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Reporter</Text>
            <View style={styles.userInfo}>
              <User size={16} color={Colors.light.textLight} />
              <Text style={styles.userName}>{selectedReport.reporterName}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Reported User</Text>
            <View style={styles.userInfo}>
              <User size={16} color={Colors.light.textLight} />
              <Text style={styles.userName}>{selectedReport.reportedUserName}</Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{selectedReport.description}</Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timelineItem}>
              <Calendar size={14} color={Colors.light.textLight} />
              <Text style={styles.timelineText}>Reported: {formatDate(selectedReport.createdAt)}</Text>
            </View>
            {selectedReport.updatedAt && (
              <View style={styles.timelineItem}>
                <Calendar size={14} color={Colors.light.textLight} />
                <Text style={styles.timelineText}>Updated: {formatDate(selectedReport.updatedAt)}</Text>
              </View>
            )}
          </View>

          {selectedReport.adminNotes && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Admin Notes</Text>
              <Text style={styles.notesText}>{selectedReport.adminNotes}</Text>
            </View>
          )}

          {selectedReport.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                onPress={() => handleReportAction(selectedReport.id, 'investigate')}
              >
                <Eye size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Investigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                onPress={() => handleReportAction(selectedReport.id, 'resolve')}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Resolve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                onPress={() => handleReportAction(selectedReport.id, 'dismiss')}
              >
                <XCircle size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reports & Issues</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.light.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search reports..."
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
          <FilterButton title="Investigating" isSelected={selectedStatus === 'investigating'} onPress={() => setSelectedStatus('investigating')} />
          <FilterButton title="Resolved" isSelected={selectedStatus === 'resolved'} onPress={() => setSelectedStatus('resolved')} />
          <FilterButton title="Dismissed" isSelected={selectedStatus === 'dismissed'} onPress={() => setSelectedStatus('dismissed')} />
        </View>
        
        <Text style={styles.filterLabel}>Type:</Text>
        <View style={styles.filterRow}>
          <FilterButton title="All" isSelected={selectedType === 'all'} onPress={() => setSelectedType('all')} />
          <FilterButton title="Harassment" isSelected={selectedType === 'harassment'} onPress={() => setSelectedType('harassment')} />
          <FilterButton title="Inappropriate" isSelected={selectedType === 'inappropriate_content'} onPress={() => setSelectedType('inappropriate_content')} />
          <FilterButton title="Safety" isSelected={selectedType === 'safety_concern'} onPress={() => setSelectedType('safety_concern')} />
          <FilterButton title="Spam" isSelected={selectedType === 'spam'} onPress={() => setSelectedType('spam')} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredReports.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredReports.filter(r => r.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredReports.filter(r => r.severity === 'critical').length}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredReports.filter(r => r.status === 'resolved').length}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </View>
      </View>

      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReportCard report={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shield size={48} color={Colors.light.textLight} />
            <Text style={styles.emptyText}>No reports found</Text>
            <Text style={styles.emptySubtext}>All reports will appear here for review</Text>
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
    marginTop: 8,
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
  reportCard: {
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
  criticalReport: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  reportUsers: {
    fontSize: 12,
    color: Colors.light.textLight,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 10,
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
  reportDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    color: Colors.light.text,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 12,
    color: Colors.light.textLight,
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