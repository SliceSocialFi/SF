CREATE TABLE "task_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"applicant_profile_id" varchar(255) NOT NULL,
	"cover_letter" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"employer_profile_id" varchar(255) NOT NULL,
	"freelancer_profile_id" varchar(255),
	"title" varchar(255) NOT NULL,
	"objective" text NOT NULL,
	"deliverables" text NOT NULL,
	"acceptance_criteria" text NOT NULL,
	"reward_points" integer NOT NULL,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deadline" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"profile_id" varchar(255) NOT NULL,
	"username" varchar(100),
	"reputation_score" integer DEFAULT 100 NOT NULL,
	"reward_points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"professional_roles" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_applications" ADD CONSTRAINT "task_applications_applicant_profile_id_users_profile_id_fk" FOREIGN KEY ("applicant_profile_id") REFERENCES "public"."users"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_employer_profile_id_users_profile_id_fk" FOREIGN KEY ("employer_profile_id") REFERENCES "public"."users"("profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_freelancer_profile_id_users_profile_id_fk" FOREIGN KEY ("freelancer_profile_id") REFERENCES "public"."users"("profile_id") ON DELETE set null ON UPDATE no action;