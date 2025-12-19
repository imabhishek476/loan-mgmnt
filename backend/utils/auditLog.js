
const AuditLog = require("../models/AuditLog");
const moment = require("moment");

const createAuditLog = async (
  userId,
  userRole,
  action,
  entity,
  entityId,
  data = {}
) => {
  try {
    const getActionMessage = (action, entity) => {
      const capEntity = entity.charAt(0).toUpperCase() + entity.slice(1);
      const lowerAction = action.toLowerCase();
      if (lowerAction.includes("create")) return `${capEntity} created`;
      if (lowerAction.includes("update")) return `${capEntity} updated`;
      if (lowerAction.includes("delete")) return `${capEntity} deleted`;
      return `${capEntity} ${action}`;
    };

    const message = getActionMessage(action, entity);

    await AuditLog.create({
      userId,
      userRole,
      action,
      entity,
      data,
      message,
      expireAt: moment().add(30, "days").toDate(),
    });
  } catch (err) {
    console.error("❌ Error creating audit log:", err);
  }
};

module.exports = createAuditLog;
