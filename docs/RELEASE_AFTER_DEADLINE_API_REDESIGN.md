# POST /tasks/:id/release-after-deadline - API Redesign

## 🎯 Vấn đề cũ
- Frontend gửi `recipientAddress` → Rủi ro: User nhầm địa chỉ employer
- Không sync data khi blockchain đã settled nhưng DB chưa cập nhật

## ✅ Giải pháp mới

### Logic Flow

```
1. Validate Input
   ├─ Get taskId from URL params
   ├─ Get optional reason from request body
   └─ Verify user authentication

2. Query Database (Find Accepted Freelancer)
   ├─ Find task by ID
   ├─ Query task_applications WHERE status = 'accepted'
   ├─ Join with users/profiles to get wallet_address
   └─ Error if no accepted freelancer found

3. Get Freelancer Address (2 sources)
   ├─ Primary: From escrow_tasks table (matches blockchain)
   └─ Fallback: Read directly from blockchain via getEscrowByTaskId()

4. Execute Blockchain Release
   ├─ Call blockchainService.releaseAfterDeadline(taskId, freelancerAddress, reason)
   └─ Handle "already settled" error gracefully

5. Update Database (Always sync)
   ├─ Update task.status = 'completed'
   ├─ Update application.status = 'completed'
   └─ Set completedAt timestamp

6. Send Notification
   └─ Notify freelancer about payment release
```

## 📋 API Specification

### Endpoint
```
POST /tasks/:id/release-after-deadline
```

### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "reason": "Optional release reason"  // Can be omitted
}
```

### Response - Success (200)

**Normal Success:**
```json
{
  "success": true,
  "message": "Payment released successfully to freelancer after deadline",
  "txHash": "0x...",
  "blockNumber": 12345678,
  "taskId": "task-123",
  "recipientType": "freelancer",
  "recipientAddress": "0x...",
  "freelancerProfileId": "profile-456",
  "task": { ... }
}
```

**Already Settled (Sync Success):**
```json
{
  "success": true,
  "message": "Task was already settled on-chain. Database synced successfully.",
  "alreadySettled": true,
  "taskId": "task-123",
  "task": { ... }
}
```

### Response - Errors

#### 400 - No Accepted Freelancer
```json
{
  "error": "No accepted freelancer found for this task. Cannot determine recipient.",
  "code": "NO_ACCEPTED_FREELANCER"
}
```

#### 400 - Deadline Not Reached
```json
{
  "error": "Deadline has not passed yet. Remaining time: 5h 30m",
  "code": "DEADLINE_NOT_REACHED",
  "deadline": "2025-12-01T00:00:00Z",
  "currentTime": "2025-11-27T18:30:00Z",
  "remainingMs": 19800000
}
```

#### 400 - No Deposit
```json
{
  "error": "No on-chain deposit found for this task. Cannot release payment.",
  "code": "NO_DEPOSIT"
}
```

#### 404 - Escrow Not Found
```json
{
  "error": "Cannot determine freelancer address. Escrow data not found.",
  "code": "ESCROW_NOT_FOUND"
}
```

## 💻 Implementation Guide

### Database Schema

**task_applications:**
```sql
- id (PK)
- task_id (FK -> tasks.id)
- applicant_profile_id (FK -> profiles.id)
- status ('pending', 'accepted', 'rejected', 'completed')
- completed_at (timestamp)
```

**escrow_tasks:**
```sql
- id (PK)
- task_id (matches blockchain taskId)
- freelancer (address)
- employer (address)
- amount (bigint)
- deadline (timestamp)
```

### Key SQL Queries

**Find Accepted Application:**
```sql
SELECT * FROM task_applications 
WHERE task_id = ? 
  AND (status = 'accepted' OR status = 'in_review')
LIMIT 1
```

**Get Freelancer Address from Escrow:**
```sql
SELECT freelancer FROM escrow_tasks
WHERE task_id = ?
LIMIT 1
```

**Update to Completed:**
```sql
-- Update task
UPDATE tasks 
SET status = 'completed', updated_at = NOW()
WHERE id = ?

-- Update application
UPDATE task_applications
SET status = 'completed', completed_at = NOW()
WHERE id = ?
```

### Error Handling Priority

```typescript
try {
  // Execute blockchain release
  const receipt = await releaseAfterDeadline(taskId, freelancerAddress, reason);
  
  // Update database
  await updateTaskStatus(taskId, 'completed');
  
  return { success: true, txHash: receipt.hash };
  
} catch (error) {
  // Priority 1: Already Settled → Sync DB and return success
  if (error.message.includes('already settled') || 
      error.message.includes('settled')) {
    
    console.log('⚠️ Blockchain already settled, syncing database...');
    
    // Sync database to match blockchain state
    await updateTaskStatus(taskId, 'completed');
    await updateApplicationStatus(applicationId, 'completed');
    
    return {
      success: true,
      message: 'Task was already settled on-chain. Database synced successfully.',
      alreadySettled: true
    };
  }
  
  // Priority 2: Other blockchain errors
  if (error.message.includes('deadline not reached')) {
    return { error: 'Deadline not reached', code: 'DEADLINE_NOT_REACHED' };
  }
  
  // Priority 3: Unknown errors
  throw error;
}
```

## 🔒 Security Improvements

### Before (Old API)
```json
// Frontend controls recipient - DANGEROUS!
{
  "recipientAddress": "0x...",  // ❌ User can send wrong address
  "reason": "..."
}
```

### After (New API)
```json
// Backend controls recipient - SAFE!
{
  "reason": "..."  // ✅ Only optional metadata
}
```

**Security Benefits:**
1. ✅ Frontend cannot manipulate recipient address
2. ✅ Recipient always determined from DB (single source of truth)
3. ✅ Prevents accidental refund to employer
4. ✅ Automatic data sync when blockchain already settled

## 🧪 Testing Scenarios

### Test Case 1: Normal Flow
```
Given: Task with deadline passed and accepted application exists
When: Call POST /tasks/:id/release-after-deadline
Then: 
  - Find freelancer from DB
  - Release funds on blockchain
  - Update DB status to completed
  - Return 200 with txHash
```

### Test Case 2: Already Settled
```
Given: Escrow already released on blockchain but DB not updated
When: Call POST /tasks/:id/release-after-deadline
Then:
  - Blockchain throws "already settled" error
  - Catch error and sync DB
  - Update task and application to completed
  - Return 200 with alreadySettled: true
```

### Test Case 3: No Accepted Freelancer
```
Given: Task has no accepted application
When: Call POST /tasks/:id/release-after-deadline
Then:
  - Return 400 with code NO_ACCEPTED_FREELANCER
```

### Test Case 4: Deadline Not Reached
```
Given: Task deadline is in the future
When: Call POST /tasks/:id/release-after-deadline
Then:
  - Return 400 with remaining time info
```

## 📊 Migration Checklist

- [x] Backend: Implement new endpoint logic
- [x] Backend: Add database query for accepted application
- [x] Backend: Add escrow_tasks fallback logic
- [x] Backend: Implement "already settled" sync handler
- [ ] Frontend: Remove recipientAddress from payload
- [ ] Frontend: Update error handling for new error codes
- [ ] Frontend: Handle alreadySettled response
- [ ] Testing: All 4 test scenarios
- [ ] Docs: Update API documentation

## 🎉 Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| Security | ❌ Client-controlled address | ✅ DB-controlled address |
| Data Sync | ❌ Manual fix needed | ✅ Auto-sync on settled |
| Error UX | ❌ Shows error on settled | ✅ Success + sync message |
| Reliability | ❌ Depends on frontend | ✅ Backend single source |
| Testability | ❌ Hard to test edge cases | ✅ Clear test scenarios |
