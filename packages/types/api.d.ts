export type Oembed = {
  title: string;
  description: string;
  url: string;
};

export type STS = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export type TaskStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface User {
  id: number;
  profileId: string;
  username?: string | null;
  reputationScore: number;
  rewardPoints: number;
  level: number;
  professionalRoles?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  employerProfileId: string;
  freelancerProfileId?: string | null;
  title: string;
  objective: string;
  deliverables: string;
  acceptanceCriteria: string;
  rewardPoints: number;
  status: TaskStatus;
  createdAt: string;
  deadline?: string | null;
}

export interface TaskApplication {
  id: number;
  taskId: number;
  applicantProfileId: string;
  coverLetter?: string | null;
  status: ApplicationStatus;
  appliedAt: string;
}
