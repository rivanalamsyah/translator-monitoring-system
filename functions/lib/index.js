"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deadlineCronJob = exports.submitAssignmentCallable = exports.onAssignmentUpdate = exports.createAssignmentTrigger = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// 1. createAssignmentTrigger (Firestore onCreate)
exports.createAssignmentTrigger = (0, firestore_1.onDocumentCreated)("assignments/{assignmentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const assignmentData = snapshot.data();
    const translatorId = assignmentData.translatorId;
    if (translatorId) {
        const points = assignmentData.calculatedPoints || 0;
        const profileRef = db.collection("translator_profiles").doc(translatorId);
        await db.runTransaction(async (transaction) => {
            const profileDoc = await transaction.get(profileRef);
            if (!profileDoc.exists)
                return;
            const profileData = profileDoc.data();
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
exports.onAssignmentUpdate = (0, firestore_1.onDocumentUpdated)("assignments/{assignmentId}", async (event) => {
    const change = event.data;
    if (!change)
        return;
    const beforeData = change.before.data();
    const afterData = change.after.data();
    // Handle status changes
    if (beforeData.status !== afterData.status) {
        const translatorId = afterData.translatorId;
        if (translatorId) {
            const profileRef = db.collection("translator_profiles").doc(translatorId);
            // If status changed to COMPLETED
            if (afterData.status === "COMPLETED") {
                const points = afterData.calculatedPoints || 0;
                await db.runTransaction(async (transaction) => {
                    const profileDoc = await transaction.get(profileRef);
                    if (!profileDoc.exists)
                        return;
                    const profileData = profileDoc.data();
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
            }
            else if (afterData.status === "PAUSED") {
                await profileRef.update({ status: "PAUSED" });
            }
            else if (afterData.status === "WORKING") {
                await profileRef.update({ status: "WORKING" });
            }
        }
        // Add to audit logs
        await db.collection("audit_logs").add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: "system", // Trigger functions act as system actor
            action: "UPDATE_ASSIGNMENT_STATUS",
            targetDocumentId: change.after.id,
            details: `Assignment status changed from ${beforeData.status} to ${afterData.status}`
        });
    }
});
exports.submitAssignmentCallable = (0, https_1.onCall)(async (request) => {
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const role = auth.token.role;
    const translatorProfileId = auth.token.translatorProfileId;
    if (role !== "TRANSLATOR" || !translatorProfileId) {
        throw new https_1.HttpsError("permission-denied", "User is not authorized to submit translations.");
    }
    const { assignmentId, resultFileName, resultFileUrl, submissionNotes } = request.data;
    const assignmentRef = db.collection("assignments").doc(assignmentId);
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(assignmentRef);
        if (!doc.exists) {
            throw new https_1.HttpsError("not-found", "Assignment not found.");
        }
        const data = doc.data();
        if (data.translatorId !== translatorProfileId) {
            throw new https_1.HttpsError("permission-denied", "This assignment is not assigned to you.");
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
            targetUserId: doc.id,
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
exports.deadlineCronJob = (0, scheduler_1.onSchedule)("*/15 * * * *", async () => {
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
                const profileData = profileDoc.data();
                const userId = profileData.userId;
                // Send push notification
                await db.collection("notifications").add({
                    targetUserId: userId,
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
//# sourceMappingURL=index.js.map