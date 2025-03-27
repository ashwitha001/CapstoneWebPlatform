"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
exports.onHikeAssignment = functions.firestore
    .document('hikes/{hikeId}')
    .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    // Check if a guide was assigned or changed
    if (newData.assignedGuide !== previousData.assignedGuide && newData.assignedGuide) {
        try {
            // Get the guide's details from the users collection
            const guideSnapshot = await admin.firestore()
                .collection('users')
                .where('email', '==', newData.assignedGuide)
                .get();
            if (!guideSnapshot.empty) {
                // Get the guide's Firebase Auth user
                const userRecord = await admin.auth().getUserByEmail(newData.assignedGuide);
                // Create the dynamic link to the guide's dashboard
                const dashboardLink = `${functions.config().app.url}/guide-dashboard`;
                // Send the custom email using the template
                await admin.auth().generatePasswordResetLink(newData.assignedGuide, {
                    url: dashboardLink,
                    handleCodeInApp: true
                });
                // Update the guide's custom claims to include this hike
                const customClaims = userRecord.customClaims || {};
                const assignedHikes = customClaims.assignedHikes || [];
                if (!assignedHikes.includes(change.after.id)) {
                    await admin.auth().setCustomUserClaims(userRecord.uid, Object.assign(Object.assign({}, customClaims), { assignedHikes: [...assignedHikes, change.after.id] }));
                }
                console.log(`Assignment notification sent to ${newData.assignedGuide}`);
                return null;
            }
        }
        catch (error) {
            console.error('Error sending assignment notification:', error);
        }
    }
    return null;
});
//# sourceMappingURL=index.js.map