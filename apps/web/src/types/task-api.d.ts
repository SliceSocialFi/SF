// Type definitions for Task Management API

export type TaskStatus = "open" | "in_review" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "submitted" | "accepted" | "rejected" | "needs_revision" | "completed";
export type OutcomeType = "text" | "file";
export type NotificationType = "task_created" | "application_received" | "application_accepted" | "application_rejected" | "task_submitted" | "task_approved" | "task_needs_revision" | "task_rated" | "rating_reminder";

// Task types
export interface Task {
  id: string;
  title: string;
  objective: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  rewardPoints: number;
  status: TaskStatus;
  employerProfileId: string;
  freelancerProfileId?: string | null;
  createdAt: string;
  deadline?: string | null;
  checklist?: TaskChecklistItem[];
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  itemText: string;
  isCompleted: boolean;
  orderIndex: number;
}

export interface CreateTaskPayload {
  title: string;
  objective: string;
  deliverables: string;
  acceptanceCriteria: string;
  rewardPoints: number;
  deadline?: string;
  checklist?: Array<{
    itemText: string;
    orderIndex?: number;
  }>;
}

export interface UpdateTaskPayload {
  title?: string;
  objective?: string;
  deliverables?: string;
  acceptanceCriteria?: string;
  rewardPoints?: number;
  deadline?: string;
  status?: TaskStatus;
  freelancerProfileId?: string;
}

// Application types
export interface Application {
  id: string;
  taskId: string;
  applicantName?: string;
  applicantAvatar?: string;
  applicantProfileId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  outcome?: string;
  outcomeType?: OutcomeType;
  feedback?: string;
  rating?: number;
  comment?: string;
  submissionCount?: number;
  appliedAt: string;
  completedAt?: string | null;
}

export interface CreateApplicationPayload {
  taskId: string;
  coverLetter?: string;
}

export interface SubmitOutcomePayload {
  outcome?: string;
  outcomeType?: OutcomeType;
}

export interface UpdateApplicationPayload {
  status: ApplicationStatus;
  feedback?: string;
  rating?: number;
  comment?: string;
}

export interface RateApplicationPayload {
  rating: number;
  comment?: string;
}

// User types
export interface User {
  profileId: string;
  username?: string;
  professionalRoles?: string[];
  reputationScore: number;
  rewardPoints: number;
  level: number;
  createdAt: string;
}

export interface CreateUserPayload {
  profileId: string;
  username?: string;
  professionalRoles?: string[];
}

export interface UpdateUserPayload {
  username?: string;
  professionalRoles?: string[];
  reputationScore?: number;
  rewardPoints?: number;
  level?: number;
}

export interface AdjustPointsPayload {
  rewardPoints?: number;
  reputationScore?: number;
}

// Notification types
export interface Notification {
  id: string;
  recipientProfileId: string;
  senderProfileId?: string | null;
  sender?: {
    username?: string;
    avatar?: string;
  } | null;
  title: string;
  message: string;
  type?: NotificationType;
  isRead: boolean;
  metadata?: {
    taskId?: string;
    applicationId?: string;
    [key: string]: any;
  };
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
