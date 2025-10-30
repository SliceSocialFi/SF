# 🗄️ Database Schema Design - Nền tảng Liên kết

## 📋 Tổng quan

Database được thiết kế để liên kết tất cả dữ liệu với **Lens Profile ID** (`payload.act.sub` từ JWT), tạo nền tảng cho các tính năng mở rộng của Hey.

## 🔑 Khóa chính: Profile ID

- **Format**: `0x01`, `0x02`, `0x03`... (Lens Profile ID)
- **Type**: `VARCHAR(42)` với constraint `^0x[0-9a-fA-F]+$`
- **Sử dụng**: Làm khóa chính hoặc khóa ngoại trong tất cả bảng

## 📊 Cấu trúc Bảng

### 1️⃣ **users** - Thông tin cơ bản user
```sql
CREATE TABLE users (
  profile_id VARCHAR(42) PRIMARY KEY,  -- Lens Profile ID
  handle VARCHAR(255) UNIQUE NOT NULL, -- @username
  display_name VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);
```

### 2️⃣ **user_reputation** - Hệ thống điểm uy tín
```sql
CREATE TABLE user_reputation (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(42) REFERENCES users(profile_id),
  hey_score INTEGER DEFAULT 0,
  community_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  reputation_level VARCHAR(50) DEFAULT 'newcomer',
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3️⃣ **tasks** - Hệ thống công việc/nhiệm vụ
```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  task_uuid UUID DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  creator_profile_id VARCHAR(42) REFERENCES users(profile_id),
  assigned_to_profile_id VARCHAR(42) REFERENCES users(profile_id),
  requirements TEXT[],
  skills_required TEXT[],
  deliverables TEXT[],
  acceptance_criteria TEXT,
  reward_amount DECIMAL(18,8) DEFAULT 0,
  reward_token VARCHAR(100),
  reward_type VARCHAR(50) DEFAULT 'hey_tokens',
  deadline TIMESTAMP,
  estimated_hours INTEGER,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4️⃣ **task_applications** - Đơn ứng tuyển
```sql
CREATE TABLE task_applications (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id),
  applicant_profile_id VARCHAR(42) REFERENCES users(profile_id),
  cover_letter TEXT,
  proposed_timeline INTEGER,
  proposed_reward DECIMAL(18,8),
  portfolio_links TEXT[],
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_at TIMESTAMP,
  reviewed_by_profile_id VARCHAR(42) REFERENCES users(profile_id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5️⃣ **user_skills** - Kỹ năng user
```sql
CREATE TABLE user_skills (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(42) REFERENCES users(profile_id),
  skill_name VARCHAR(100) NOT NULL,
  skill_level VARCHAR(20) DEFAULT 'beginner',
  years_experience INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  verified_by_profile_id VARCHAR(42) REFERENCES users(profile_id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6️⃣ **user_activity** - Hoạt động user
```sql
CREATE TABLE user_activity (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(42) REFERENCES users(profile_id),
  activity_type VARCHAR(50) NOT NULL,
  activity_data JSONB DEFAULT '{}',
  points_earned INTEGER DEFAULT 0,
  related_entity_type VARCHAR(50),
  related_entity_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7️⃣ **notifications** - Thông báo
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(42) REFERENCES users(profile_id),
  title VARCHAR(500) NOT NULL,
  message TEXT,
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  action_url TEXT,
  action_data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### 8️⃣ **user_preferences** - Tùy chỉnh cá nhân
```sql
CREATE TABLE user_preferences (
  profile_id VARCHAR(42) PRIMARY KEY REFERENCES users(profile_id),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  task_notifications BOOLEAN DEFAULT true,
  reputation_notifications BOOLEAN DEFAULT true,
  profile_visibility VARCHAR(20) DEFAULT 'public',
  skill_visibility BOOLEAN DEFAULT true,
  activity_visibility BOOLEAN DEFAULT true,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔗 Mối quan hệ (Foreign Keys)

```
users (profile_id) 
├── user_reputation (profile_id)
├── tasks (creator_profile_id)
├── tasks (assigned_to_profile_id)
├── task_applications (applicant_profile_id)
├── user_skills (profile_id)
├── user_activity (profile_id)
├── notifications (profile_id)
└── user_preferences (profile_id)
```

## 📈 Indexes cho Performance

```sql
-- User indexes
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_last_active ON users(last_active_at);

-- Reputation indexes
CREATE INDEX idx_reputation_profile_id ON user_reputation(profile_id);
CREATE INDEX idx_reputation_total_score ON user_reputation(total_score DESC);

-- Task indexes
CREATE INDEX idx_tasks_creator ON tasks(creator_profile_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to_profile_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);

-- Application indexes
CREATE INDEX idx_applications_task ON task_applications(task_id);
CREATE INDEX idx_applications_applicant ON task_applications(applicant_profile_id);

-- Activity indexes
CREATE INDEX idx_activity_profile ON user_activity(profile_id);
CREATE INDEX idx_activity_type ON user_activity(activity_type);

-- Notification indexes
CREATE INDEX idx_notifications_profile ON notifications(profile_id);
CREATE INDEX idx_notifications_unread ON notifications(profile_id, is_read) WHERE is_read = false;
```

## 🎯 API Endpoints

### Users API (`/users`)
- `POST /profile` - Tạo/cập nhật profile
- `GET /profile/:profileId` - Lấy thông tin profile
- `GET /reputation/:profileId` - Lấy điểm uy tín
- `POST /reputation/update` - Cập nhật điểm uy tín
- `GET /leaderboard` - Bảng xếp hạng

### Tasks API (`/tasks`)
- `POST /create` - Tạo task mới
- `GET /:taskId` - Lấy thông tin task
- `GET /` - Danh sách tasks (với filters)
- `POST /:taskId/apply` - Ứng tuyển task
- `GET /:taskId/applications` - Danh sách ứng tuyển
- `PATCH /:taskId/status` - Cập nhật trạng thái task

## 🚀 Cách sử dụng

### 1. Chạy Migration
```bash
cd apps/api
npx tsx src/migrations/index.ts
```

### 2. Test API
```bash
# Tạo user profile
curl -X POST http://localhost:4000/users/profile \
  -H "Content-Type: application/json" \
  -d '{"profileId":"0x01","handle":"testuser","displayName":"Test User"}'

# Tạo task
curl -X POST http://localhost:4000/tasks/create \
  -H "Content-Type: application/json" \
  -d '{"creatorProfileId":"0x01","creatorHandle":"testuser","title":"Test Task"}'
```

## 🔒 Bảo mật

- Tất cả endpoints đều validate Profile ID format
- Foreign key constraints đảm bảo data integrity
- JWT authentication qua `authContext` middleware
- Rate limiting cho các endpoints quan trọng

## 📊 Monitoring

- Tất cả bảng đều có `created_at`, `updated_at`
- Activity tracking cho mọi hành động
- Reputation system với multiple metrics
- Notification system cho real-time updates
