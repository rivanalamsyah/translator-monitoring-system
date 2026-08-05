import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// 1. createAssignmentTrigger (Firestore onCreate)
export const createAssignmentTrigger = onDocumentCreated("assignments/{assignmentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const assignmentData = snapshot.data();
  const translatorId = assignmentData.translatorId;

  if (translatorId) {
    const points = assignmentData.calculatedPoints || 0;
    const profileRef = db.collection("translator_profiles").doc(translatorId);

    await db.runTransaction(async (transaction) => {
      const profileDoc = await transaction.get(profileRef);
      if (!profileDoc.exists) return;

      const profileData = profileDoc.data()!;
      const maxCapacity = profileData.maxCapacityPoints || 20.0;
      const currentLoad = (profileData.currentLoadPoints || 0) + points;
      const remainingCapacity = maxCapacity - currentLoad;
      const utilization = Math.round((currentLoad / maxCapacity) * 100);

      transaction.update(profileRef, {
        status: "WORKING",
        currentLoadPoints: currentLoad,
        remainingCapacityPoints: remainingCapacity,
        utilizationPercentage: utilization,
        activeAssignmentId: snapshot.id
      });
    });
  }

  // Create audit log
  await db.collection("audit_logs").add({
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    userId: assignmentData.createdBy || "system",
    action: "CREATE_ASSIGNMENT",
    targetDocumentId: snapshot.id,
    details: `Assignment ${assignmentData.code} created for translator ${assignmentData.translatorName || "Unassigned"}`
  });
});

// 2. onAssignmentUpdate (Firestore onUpdate)
export const onAssignmentUpdate = onDocumentUpdated("assignments/{assignmentId}", async (event) => {
  const change = event.data;
  if (!change) return;

  const beforeData = change.before.data();
  const afterData = change.after.data();

  const points = afterData.calculatedPoints || 0;

  // Handle translator reassignment
  if (beforeData.translatorId !== afterData.translatorId) {
    const oldTranslatorId = beforeData.translatorId;
    const newTranslatorId = afterData.translatorId;

    if (oldTranslatorId) {
      const oldProfileRef = db.collection("translator_profiles").doc(oldTranslatorId);
      await db.runTransaction(async (transaction) => {
        const profileDoc = await transaction.get(oldProfileRef);
        if (profileDoc.exists) {
          const profileData = profileDoc.data()!;
          const maxCapacity = profileData.maxCapacityPoints || 20.0;
          const currentLoad = Math.max(0, (profileData.currentLoadPoints || 0) - points);
          const remainingCapacity = maxCapacity - currentLoad;
          const utilization = Math.round((currentLoad / maxCapacity) * 100);
          
          transaction.update(oldProfileRef, {
            currentLoadPoints: currentLoad,
            remainingCapacityPoints: remainingCapacity,
            utilizationPercentage: utilization,
            activeAssignmentId: profileData.activeAssignmentId === change.before.id ? null : profileData.activeAssignmentId
          });
        }
      });
    }

    if (newTranslatorId) {
      const newProfileRef = db.collection("translator_profiles").doc(newTranslatorId);
      await db.runTransaction(async (transaction) => {
        const profileDoc = await transaction.get(newProfileRef);
        if (profileDoc.exists) {
          const profileData = profileDoc.data()!;
          const maxCapacity = profileData.maxCapacityPoints || 20.0;
          const currentLoad = (profileData.currentLoadPoints || 0) + points;
          const remainingCapacity = maxCapacity - currentLoad;
          const utilization = Math.round((currentLoad / maxCapacity) * 100);
          
          let newStatus = profileData.status || "READY";
          if (afterData.status === "WORKING") newStatus = "WORKING";
          else if (afterData.status === "PAUSED") newStatus = "PAUSED";
          else if (afterData.status === "REVISION") newStatus = "REVISION";
          else if (afterData.status === "ASSIGNED") newStatus = "ASSIGNED";

          transaction.update(newProfileRef, {
            status: newStatus,
            currentLoadPoints: currentLoad,
            remainingCapacityPoints: remainingCapacity,
            utilizationPercentage: utilization,
            activeAssignmentId: afterData.status === "WORKING" ? change.after.id : profileData.activeAssignmentId
          });
        }
      });
    }

    // Add audit log for reassignment
    await db.collection("audit_logs").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: "system",
      action: "REASSIGN_ASSIGNMENT",
      targetDocumentId: change.after.id,
      details: `Assignment ${afterData.code} reassigned from translator ${beforeData.translatorName || "None"} to ${afterData.translatorName || "None"}`
    });
  }

  // Handle status changes (when translator is the same)
  if (beforeData.status !== afterData.status) {
    const translatorId = afterData.translatorId;

    if (translatorId && beforeData.translatorId === afterData.translatorId) {
      const profileRef = db.collection("translator_profiles").doc(translatorId);

      // If status changed to COMPLETED
      if (afterData.status === "COMPLETED") {
        await db.runTransaction(async (transaction) => {
          const profileDoc = await transaction.get(profileRef);
          if (!profileDoc.exists) return;

          const profileData = profileDoc.data()!;
          const maxCapacity = profileData.maxCapacityPoints || 20.0;
          const currentLoad = Math.max(0, (profileData.currentLoadPoints || 0) - points);
          const remainingCapacity = maxCapacity - currentLoad;
          const utilization = Math.round((currentLoad / maxCapacity) * 100);
          const completedJobs = (profileData.completedJobsCount || 0) + 1;

          transaction.update(profileRef, {
            status: "READY",
            currentLoadPoints: currentLoad,
            remainingCapacityPoints: remainingCapacity,
            utilizationPercentage: utilization,
            activeAssignmentId: null,
            completedJobsCount: completedJobs
          });
        });
      } else if (afterData.status === "PAUSED") {
        await profileRef.update({ status: "PAUSED" });
      } else if (afterData.status === "WORKING") {
        await profileRef.update({ status: "WORKING" });
      } else if (afterData.status === "ASSIGNED") {
        await profileRef.update({ status: "ASSIGNED" });
      } else if (afterData.status === "REVISION") {
        await profileRef.update({ status: "REVISION" });
      }
    }

    // Add to audit logs
    await db.collection("audit_logs").add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userId: "system",
      action: "UPDATE_ASSIGNMENT_STATUS",
      targetDocumentId: change.after.id,
      details: `Assignment status changed from ${beforeData.status} to ${afterData.status}`
    });
  }
});

// 3. submitAssignmentCallable (HTTPS Callable)
interface SubmitPayload {
  assignmentId: string;
  resultFileName: string;
  resultFileUrl: string;
  submissionNotes?: string;
}

export const submitAssignmentCallable = onCall<SubmitPayload>(async (request) => {
  const auth = request.auth;
  if (!auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const role = auth.token.role;
  const translatorProfileId = auth.token.translatorProfileId as string;

  if (role !== "TRANSLATOR" || !translatorProfileId) {
    throw new HttpsError("permission-denied", "User is not authorized to submit translations.");
  }

  const { assignmentId, resultFileName, resultFileUrl, submissionNotes } = request.data;
  const assignmentRef = db.collection("assignments").doc(assignmentId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(assignmentRef);
    if (!doc.exists) {
      throw new HttpsError("not-found", "Assignment not found.");
    }

    const data = doc.data()!;
    if (data.translatorId !== translatorProfileId) {
      throw new HttpsError("permission-denied", "This assignment is not assigned to you.");
    }

    // Update assignment fields
    transaction.update(assignmentRef, {
      status: "WAITING_REVIEW",
      resultFileName,
      resultFileUrl,
      submissionNotes: submissionNotes || "",
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Close any active timer logs
    const activeLogsQuery = db.collection("timer_logs")
      .where("assignmentId", "==", assignmentId)
      .where("translatorId", "==", translatorProfileId)
      .orderBy("startTime", "desc")
      .limit(1);

    const logDocs = await activeLogsQuery.get();
    if (!logDocs.empty) {
      const activeLogDoc = logDocs.docs[0];
      const activeLogData = activeLogDoc.data();

      if (!activeLogData.endTime) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - activeLogData.startTime.toDate().getTime()) / 1000);

        transaction.update(activeLogDoc.ref, {
          endTime: admin.firestore.Timestamp.fromDate(endTime),
          durationSeconds: duration
        });
      }
    }
  });

  // Notify admins
  const adminsQuery = db.collection("users").where("role", "==", "SUPER_ADMIN");
  const adminDocs = await adminsQuery.get();
  const notificationPromises = adminDocs.docs.map((doc) => {
    return db.collection("notifications").add({
      userId: doc.id,
      title: "New Translation Submitted 📄",
      message: `Translator ${auth.token.name || "Ahmad"} submitted document ${assignmentId}.`,
      type: "INFO",
      assignmentId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await Promise.all(notificationPromises);

  return { success: true };
});

// 4. deadlineCronJob (Scheduled Function - runs every 15 mins)
export const deadlineCronJob = onSchedule("*/15 * * * *", async () => {
  const now = new Date();
  const alarmThreshold = new Date(now.getTime() + 2 * 3600 * 1000); // 2 hours from now

  const assignmentsQuery = db.collection("assignments")
    .where("status", "in", ["ASSIGNED", "WORKING", "PAUSED", "REVISION"])
    .where("deadlineAt", "<=", admin.firestore.Timestamp.fromDate(alarmThreshold))
    .where("isDeadlineAlertSent", "==", false);

  const pendingDocs = await assignmentsQuery.get();

  const notifyPromises = pendingDocs.docs.map(async (doc) => {
    const data = doc.data();
    const translatorId = data.translatorId;

    if (translatorId) {
      // Find translator user ID
      const profileDoc = await db.collection("translator_profiles").doc(translatorId).get();
      if (profileDoc.exists) {
        const profileData = profileDoc.data()!;
        const userId = profileData.userId;

        // Send push notification
        await db.collection("notifications").add({
          userId: userId,
          title: "Urgent Deadline Warning ⏰",
          message: `The deadline for document ${data.code} is in less than 2 hours.`,
          type: "ALERT",
          assignmentId: doc.id,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    // Mark as alerted
    await doc.ref.update({ isDeadlineAlertSent: true });
  });

  await Promise.all(notifyPromises);
});
