export const state = {
  evaluations: [],
  templates: JSON.parse(localStorage.getItem("qms_templates")) || [],
  notificationSettings: JSON.parse(
    localStorage.getItem("qms_notification_settings")
  ) || { teamLeadEmail: "", notifyAgents: false },
  autoFailed: false,
  pendingCalibration: [],
  disputeEvalId: null,
  agents: []
};
