export type Role = 'admin' | 'caller';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  leadCount?: number;
  dueFollowUps?: number;
  completedFollowUps?: number;
  joiningDate?: string;
  joiningDateStatus?: 'Pending Approval' | 'Approved' | 'Rejected';
  joiningDateSubmittedAt?: string;
  joiningDateApprovedBy?: string;
  paymentModel?: 'Salary Based';
  createdAt?: string;
}

export type LeadStatus =
  | 'New'
  | 'Interested'
  | 'Follow-up'
  | 'Meeting Scheduled'
  | 'Converted'
  | 'Not Interested'
  | 'Closed'
  | 'Not Picked';

export type LeadPriority = 'Low' | 'Medium' | 'High';
export type LeadType = 'imported' | 'manual';

export interface Note {
  _id?: string;
  content: string;
  createdBy: string;
  createdByName: string;
  status?: LeadStatus;
  followUpDate?: string;
  isWhatsApp?: boolean;
  createdAt: string;
}

export interface Lead {
  _id: string;
  serialNumber?: number;
  userId: string;
  callerName: string;
  callerEmail: string;
  leadType?: LeadType;
  isNewLead?: boolean;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  source: string;
  status: LeadStatus;
  priority: LeadPriority;
  categoryId?: string;
  categoryName?: string;
  cityId?: string;
  cityName?: string;
  notes: Note[];
  latestUpdate: string;
  completedFollowUps: number;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterParams {
  status?: LeadStatus | string;
  priority?: LeadPriority | string;
  search?: string;
  dueFollowUp?: boolean;
  isNewLead?: boolean;
  leadType?: string;
  callerId?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
  serialNumber?: number;
  serialNumberStart?: number;
  serialNumberEnd?: number;
  projectType?: 'website' | 'app' | 'All';
  categoryId?: string;
  cityId?: string;
}

export interface ImportHistoryRecord {
  _id: string;
  fileName: string;
  importedBy: string;
  assignedCallerId: string;
  assignedCallerName: string;
  assignedCallerEmail: string;
  totalRows: number;
  successfulImports: number;
  duplicateCount: number;
  failedImports: number;
  duplicateAction: 'skip' | 'update';
  importDate: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  leads: T[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface DashboardStats {
  totalLeads: number;
  followUpsDueToday: number;
  completedFollowUps: number;
  newLeadsAddedToday: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  callersPerformance?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    totalLeads: number;
    dueFollowUps: number;
    completedFollowUps: number;
  }[];
}

export interface ActivityLog {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  leadId?: string;
  leadName?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface ReportEditState {
  canEdit: boolean;
  reason: string;
  adminUnlockActive: boolean;
  remainingSeconds: number;
}

export interface LeadCategoryStats {
  callsMade: number;
  followUps: number;
  statusUpdated: number;
  whatsAppMessages: number;
  meetings: number;
  convertedClients: number;
  notPickedCalls: number;
}

export interface DailyReport {
  _id: string;
  userId: string;
  callerName: string;
  callerEmail: string;
  reportDate: string;
  newLeadStats?: LeadCategoryStats;
  oldLeadStats?: LeadCategoryStats;
  totalCalls: number;
  connectedCalls: number;
  notPickedCalls: number;
  followUpsDone: number;
  followUpsPending: number;
  interestedClients: number;
  convertedClients: number;
  notInterestedClients: number;
  meetingsScheduled: number;
  whatsappMessagesSent: number;
  summary?: string;
  remarks: string;
  manualEditCount?: number;
  isEditLocked: boolean;
  adminEditAllowed: boolean;
  adminEditAllowedUntil?: string;
  createdAt: string;
  updatedAt: string;
  editState?: ReportEditState;
}

export interface ReportEditHistory {
  _id: string;
  reportId: string;
  userId: string;
  callerName: string;
  editedFields: string[];
  previousData: Record<string, any>;
  newData: Record<string, any>;
  editedAt: string;
  editedBy: string;
  editorName: string;
  editReason?: string;
}

// Converted Client Module Types
export type WebsiteStatus =
  | 'Website Had To Make'
  | 'Website In Making'
  | 'Website Done'
  | 'Delivered'
  | 'On Hold';

export type ClientPaymentStatus = 'Not Paid' | 'Partially Paid' | 'Fully Paid' | 'Overdue';
export type CallerPaymentStatus = 'Not Paid' | 'Partially Paid' | 'Fully Paid';
export type ApprovalStatus = 'Pending Approval' | 'Approved' | 'Rejected';
export type ProjectType = 'website' | 'app';

export interface ConvertedClient {
  _id: string;
  leadId?: string;
  userId: string;
  callerName: string;
  callerEmail: string;

  projectType: ProjectType;

  clientName: string;
  company: string;
  phone: string;
  email: string;
  address: string;

  conversionDate: string;
  meetingDate?: string;
  meetingTime?: string;
  meetingLocation?: string;
  upcomingMeetingDate?: string;
  meetingNotes?: string;

  websiteStatus: WebsiteStatus;
  websiteDeliveryDate?: string;
  websiteCompletionDate?: string;
  latestWebsiteUpdate?: string;

  totalClientAmount: number;
  clientPaidAmount: number;
  clientPendingAmount: number;

  websiteMakingCost: number;
  domainCharges: number;
  appDevelopmentCost: number;
  playStoreCost: number;
  otherExpenses: number;
  totalExpenses: number;

  grossRevenue: number;
  netProfit: number;

  paymentStatus: ClientPaymentStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;

  lockedFields?: Record<string, boolean>;

  createdAt: string;
  updatedAt: string;
}

export interface ClientExpenseHistoryRecord {
  _id: string;
  clientId: string;
  clientName: string;
  expenseType: 'Website Development Cost' | 'Website Cost' | 'Domain Cost' | 'Domain Charge' | 'App Development Cost' | 'Play Store Cost' | 'Other Expense';
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface WebsiteUpdate {
  _id: string;
  clientId: string;
  leadId?: string;
  userId: string;
  callerName: string;
  callerEmail: string;
  updateText: string;
  websiteStatus: string;
  updatedBy: string;
  createdAt: string;
}

export interface PaymentHistory {
  _id: string;
  clientId: string;
  clientName: string;
  leadId?: string;
  userId: string;
  callerName: string;
  callerEmail: string;
  paymentType:
    | 'client_payment_received'
    | 'website_making_cost'
    | 'domain_charge'
    | 'other_expense';
  amount: number;
  paymentMode: string;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface DomainCharge {
  _id: string;
  amount: number;
  notes: string;
  chargeDate: string;
  createdBy: string;
  createdAt: string;
}

export interface OtherExpense {
  _id: string;
  amount: number;
  expenseType: string;
  notes: string;
  expenseDate: string;
  createdBy: string;
  createdAt: string;
}

export interface RevenueStats {
  totalConvertedClients: number;
  totalExpectedAmount: number;
  totalReceivedAmount: number;
  totalClientPendingAmount: number;
  totalWebsiteCost: number;
  totalDomainCharges: number;
  totalOtherExpenses: number;
  grossRevenue: number;
  netProfit: number;
  callerBreakdown?: {
    callerId: string;
    callerName: string;
    callerEmail: string;
    convertedCount: number;
    revenueGenerated: number;
  }[];
}

// Enterprise Enhancement Interfaces
export interface DeletedRecord {
  _id: string;
  originalId: string;
  collectionName: 'Lead' | 'ConvertedClient' | 'Meeting' | 'PaymentHistory' | 'AppRevenue';
  clientName: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  projectType?: 'website' | 'app';
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  conversionDate?: string;
  approvalDate?: string;
  deletionDate: string;
  deletedBy: string;
  deletedByRole: string;
  deletionReason?: string;
  callerName?: string;
  callerEmail?: string;
  websiteStatus?: string;
  paymentStatus?: string;
  data: any;
  createdAt: string;
}

export interface WhatsAppLog {
  _id: string;
  leadId?: string;
  clientId?: string;
  callerId: string;
  callerName: string;
  phone: string;
  message: string;
  templateName?: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Replied' | 'No Response';
  sentAt: string;
}

export interface ActivityTimelineRecord {
  _id: string;
  entityId: string;
  entityType: 'Lead' | 'ConvertedClient';
  action: string;
  description: string;
  performedBy: string;
  performedByRole: string;
  metadata?: any;
  createdAt: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: string;
  callerName: string;
  callerEmail: string;
  date: string;
  loginTime: string;
  logoutTime?: string;
  activeHours: number;
  breakTime: number;
  totalWorkingHours: number;
  status: 'Present' | 'Late' | 'Half Day' | 'Absent';
  notes?: string;
}

export interface AuditLogRecord {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  module: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  deviceInfo?: string;
  createdAt: string;
}

export interface BonusSlabRecord {
  _id: string;
  title: string;
  targetSales: number;
  bonusAmount: number;
  isActive: boolean;
  applicableCallers?: string[];
  createdBy: string;
  createdAt: string;
}

export interface BonusProgress {
  approvedSalesCount: number;
  currentSlab: BonusSlabRecord | null;
  nextSlab: BonusSlabRecord | null;
  salesNeeded: number;
  bannerText: string;
  allSlabs: BonusSlabRecord[];
}

export interface LeaderboardItem {
  rank: number;
  callerId: string;
  callerName: string;
  callerEmail: string;
  approvedSales: number;
  revenueGenerated: number;
  paymentsCollected: number;
  totalCalls: number;
  meetingsBooked: number;
  followUpsDone: number;
  totalLeads: number;
  conversionRate: number;
  score: number;
  isTopOfWeek?: boolean;
  isTopOfMonth?: boolean;
}

export interface LeadCategory {
  _id: string;
  name: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface City {
  _id: string;
  name: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryConfiguration {
  _id: string;
  userId: string;
  monthlySalary: number;
  monthlySalesTarget: number;
  minimumEligibleSales: number;
}

export interface SalaryProgress {
  _id: string;
  userId: string;
  approvedSales: number;
  monthlyTarget: number;
  remainingSales: number;
  isEligible: boolean;
}

export interface SalaryBonusProgress {
  _id: string;
  userId: string;
  approvedSales: number;
  targetSales: number;
  remainingSales: number;
  bonusAmount: number;
  isUnlocked: boolean;
}

export interface AttendanceSession {
  _id: string;
  userId: string;
  callerName: string;
  date: string;
  sessionIndex: number;
  loginTime: string;
  logoutTime?: string;
  workingHours: number;
  isLateLogin: boolean;
  isEarlyLogout: boolean;
}

export interface ResourceNote {
  _id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallerAssignment {
  _id: string;
  callerId: string;
  assignedNotes: string[];
  assignedResources: string[];
  assignedBy: string;
  assignedAt: string;
}

