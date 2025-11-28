# Backend Implementation: POST /tasks/:id/release-after-deadline

**Redesigned API - Security-first approach**
- Backend automatically finds freelancer address from database
- Handles "already settled" blockchain errors gracefully

> **NOTE:** This is PSEUDOCODE/REFERENCE for backend team.
> Not meant to be compiled. Backend team should adapt this to their actual Hono/Express setup.

## Implementation Code

```typescript
// Example implementation for your backend
tasksRouter.post("/:id/release-after-deadline", authMiddleware, async (c) => {
  try {
    // ===== STEP 1: VALIDATE INPUT =====
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "Invalid task ID" }, 400);
    }

    // Parse request body - only need reason (optional)
    const body = await c.req.json().catch(() => ({}));
    const { reason } = body;

    // Get verified user payload from authMiddleware
    const userPayload = (c as any).get("user") as Record<string, any> | undefined;
    const profileId = userPayload?.act?.sub || userPayload?.sub;
    if (!profileId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    console.log(`📋 Release after deadline request for task ${id}`);
    console.log(`   Requester: ${profileId}`);
    console.log(`   Reason: ${reason || '(auto-generated)'}`);

    // ===== STEP 2: GET TASK & VALIDATE DEADLINE =====
    const db: any = null; // Replace with your DB client (Drizzle/Prisma/etc)
    const tasks: any = null; // Replace with your tasks table schema
    const eq: any = null; // Replace with your query builder
    const taskApplications: any = null; // Replace with your applications table
    
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    // Check if deposit exists on-chain
    if (!task.onChainTaskId) {
      return c.json({ 
        error: "No on-chain deposit found for this task. Cannot release payment.",
        code: "NO_DEPOSIT"
      }, 400);
    }

    // CRITICAL: Check if deadline has passed
    if (!task.deadline) {
      return c.json({ 
        error: "Task has no deadline set. Cannot use release-after-deadline.",
        code: "NO_DEADLINE"
      }, 400);
    }

    const now = new Date();
    const deadline = new Date(task.deadline);

    if (now < deadline) {
      const remainingMs = deadline.getTime() - now.getTime();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      return c.json({ 
        error: `Deadline has not passed yet. Remaining time: ${remainingHours}h ${remainingMinutes}m`,
        code: "DEADLINE_NOT_REACHED",
        deadline: task.deadline,
        currentTime: now.toISOString(),
        remainingMs
      }, 400);
    }

    console.log(`✅ Deadline passed: ${deadline.toISOString()} (now: ${now.toISOString()})`);

    // ===== STEP 3: FIND ACCEPTED FREELANCER FROM DATABASE =====
    console.log(`🔍 Finding accepted freelancer for task ${id}...`);
    
    const acceptedApplications = await db
      .select()
      .from(taskApplications)
      .where(eq(taskApplications.taskId, id));

    // Find application with status 'accepted' or 'in_review' (work submitted)
    const acceptedApplication = acceptedApplications.find((app: any) => 
      app.status === "accepted" || app.status === "in_review"
    );

    if (!acceptedApplication) {
      console.log("❌ No accepted freelancer found for this task");
      return c.json({ 
        error: "No accepted freelancer found for this task. Cannot determine recipient.",
        code: "NO_ACCEPTED_FREELANCER"
      }, 400);
    }

    console.log(`✅ Found accepted application: ${acceptedApplication.id}`);
    console.log(`   Freelancer Profile ID: ${acceptedApplication.applicantProfileId}`);
    console.log(`   Application Status: ${acceptedApplication.status}`);

    // ===== STEP 4: GET FREELANCER WALLET ADDRESS =====
    // Option A: From escrow_tasks table (recommended - matches blockchain)
    const { escrowTasks } = await import("../db/schema.js");
    const [escrowTask] = await db
      .select()
      .from(escrowTasks)
      .where(eq(escrowTasks.taskId, task.onChainTaskId));

    let freelancerAddress: string;

    if (!escrowTask) {
      console.log("⚠️  Escrow task not found in database. Fetching from blockchain...");
      
      // Option B: Fallback - Read directly from blockchain
      try {
        const { getEscrowByTaskId } = await import("../services/blockchainService.js");
        const escrowData = await getEscrowByTaskId(task.onChainTaskId);
        
        freelancerAddress = escrowData.freelancer;
        
        console.log("✅ Fetched freelancer address from blockchain:");
        console.log(`   Freelancer: ${freelancerAddress}`);
      } catch (blockchainError: any) {
        console.error("❌ Failed to fetch from blockchain:", blockchainError.message);
        return c.json({ 
          error: "Cannot determine freelancer address. Escrow data not found in database and blockchain fetch failed.",
          code: "ESCROW_NOT_FOUND",
          details: blockchainError.message
        }, 404);
      }
    } else {
      freelancerAddress = escrowTask.freelancer;
      console.log("✅ Fetched freelancer address from database:");
      console.log(`   Freelancer: ${freelancerAddress}`);
    }

    const finalReason = reason || "Task deadline passed - releasing payment to freelancer";

    // ===== STEP 5: EXECUTE BLOCKCHAIN RELEASE =====
    console.log(`⏰ Releasing payment after deadline for task ${id} (on-chain: ${task.onChainTaskId})`);
    console.log(`   Deadline: ${deadline.toISOString()}, Current: ${now.toISOString()}`);
    console.log(`   Recipient: Freelancer (${acceptedApplication.applicantProfileId})`);
    console.log(`   Recipient Address: ${freelancerAddress}`);
    console.log(`   Reason: ${finalReason}`);

    let receipt;
    let alreadySettled = false;

    try {
      // Call blockchain service to release payment to freelancer
      receipt = await releaseAfterDeadline(
        task.onChainTaskId,
        freelancerAddress,
        finalReason
      );

      console.log(`✅ Release after deadline successful: ${receipt.hash}`);

    } catch (blockchainError: any) {
      console.error("⚠️  Blockchain error:", blockchainError.message);

      // ===== SPECIAL HANDLING: ALREADY SETTLED =====
      // This is the KEY part - graceful handling of "already settled"
      if (
        blockchainError.message?.includes("already settled") ||
        blockchainError.message?.includes("settled") ||
        blockchainError.message?.includes("ALREADY_SETTLED")
      ) {
        console.log("🔄 Task already settled on blockchain, syncing database...");
        alreadySettled = true;
        // Continue to database update - don't return error!
      } else {
        // Other blockchain errors - throw normally
        throw blockchainError;
      }
    }

    // ===== STEP 6: UPDATE DATABASE (Always execute, even if already settled) =====
    console.log(`📝 Updating database status to 'completed'...`);

    // Update task status to completed
    const [updatedTask] = await db
      .update(tasks)
      .set({ 
        status: "completed",
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();

    console.log(`✅ Task status updated: ${updatedTask.status}`);

    // Update the accepted application to completed
    await db
      .update(taskApplications)
      .set({ 
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(taskApplications.id, acceptedApplication.id));

    console.log(`✅ Application status updated: completed`);

    // ===== STEP 7: SEND NOTIFICATION =====
    await createNotification({
      userProfileId: acceptedApplication.applicantProfileId,
      type: "task_approved",
      title: "Payment Released",
      message: `Payment has been released for task: ${task.title}`,
      relatedTaskId: task.id,
      relatedApplicationId: acceptedApplication.id
    });

    console.log(`✅ Notification sent to freelancer`);

    // ===== STEP 8: RETURN APPROPRIATE RESPONSE =====
    if (alreadySettled) {
      // Special response for already settled case
      return c.json({
        success: true,
        message: "Task was already settled on-chain. Database synced successfully.",
        alreadySettled: true,
        taskId: id,
        recipientType: "freelancer",
        recipientAddress: freelancerAddress,
        freelancerProfileId: acceptedApplication.applicantProfileId,
        task: updatedTask
      }, 200);
    } else {
      // Normal success response
      return c.json({
        success: true,
        message: "Payment released successfully to freelancer after deadline",
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        taskId: id,
        recipientType: "freelancer",
        recipientAddress: freelancerAddress,
        freelancerProfileId: acceptedApplication.applicantProfileId,
        task: updatedTask
      }, 200);
    }

  } catch (err: any) {
    console.error("❌ Failed to release payment after deadline:", err);

    // ===== ERROR HANDLING =====

    // Handle specific blockchain errors
    if (err.message?.includes("not initialized")) {
      return c.json({ 
        error: "Blockchain service not available. Please contact administrator.",
        code: "BLOCKCHAIN_NOT_INITIALIZED"
      }, 503);
    }

    if (err.message?.includes("deadline not reached") || err.message?.includes("Deadline not reached")) {
      return c.json({ 
        error: "Deadline has not been reached yet according to the smart contract",
        code: "DEADLINE_NOT_REACHED_ONCHAIN",
        details: err.message
      }, 400);
    }

    // Handle invalid recipient address
    if (err.message?.includes("Invalid recipient") || err.message?.includes("does not match")) {
      return c.json({ 
        error: "Recipient address is invalid. Must match either employer or freelancer on the smart contract.",
        code: "INVALID_RECIPIENT_ADDRESS",
        details: err.message
      }, 400);
    }

    // Handle CALL_EXCEPTION (contract revert)
    if (err.message?.includes("CALL_EXCEPTION") || err.message?.includes("execution reverted")) {
      return c.json({ 
        error: "Transaction would fail on blockchain. Please check recipient address and contract state.",
        code: "CONTRACT_EXECUTION_FAILED",
        details: err.message
      }, 400);
    }

    if (err.message?.includes("insufficient funds") || err.message?.includes("gas")) {
      return c.json({ 
        error: "Insufficient gas or funds to execute transaction",
        code: "INSUFFICIENT_GAS"
      }, 400);
    }

    return c.json({ 
      error: "Failed to release payment after deadline. Please try again later.",
      details: err.message 
    }, 500);
  }
});
```

---

## TESTING GUIDE

### Test Case 1: Normal Flow
```bash
curl -X POST http://localhost:3000/tasks/abc-123/release-after-deadline \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Deadline passed"}'
```
**Expected:** 200 with txHash

### Test Case 2: Already Settled (Database Sync)
1. Manually release on blockchain first
2. Call API again

**Expected:** 200 with alreadySettled: true
Database should be updated to 'completed'

### Test Case 3: No Accepted Freelancer
```bash
curl -X POST http://localhost:3000/tasks/task-no-freelancer/release-after-deadline \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json"
```
**Expected:** 400 with code "NO_ACCEPTED_FREELANCER"

### Test Case 4: Deadline Not Reached
```bash
curl -X POST http://localhost:3000/tasks/task-future-deadline/release-after-deadline \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json"
```
**Expected:** 400 with code "DEADLINE_NOT_REACHED" and remaining time

---

## MIGRATION NOTES

### Breaking Changes
1. Frontend MUST remove `recipientAddress` from request body
2. Response now includes `freelancerProfileId` and `recipientAddress`
3. New response field: `alreadySettled` (boolean)

### Database Requirements
1. task_applications.status must have 'accepted' or 'in_review' values
2. escrow_tasks table should exist with freelancer address
3. Fallback: blockchain read capability via getEscrowByTaskId()

### Security Improvements
- ✅ Frontend cannot manipulate recipient address
- ✅ Single source of truth: Database
- ✅ Auto-sync when blockchain already settled
- ✅ No accidental refund to employer
