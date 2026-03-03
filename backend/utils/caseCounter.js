const Config = require("../models/Config");

const caseCounter = async (title) => {
  try {
    const updatedConfig = await Config.findOneAndUpdate(
      { title },
      {
        $inc: { value: 1 },
        $setOnInsert: { value: 1 }, // if document doesn’t exist
      },
      {
        new: true,
        upsert: true,
      }
    );

    return updatedConfig.value;
  } catch (error) {
    console.error("❌ Error generating counter:", error);
    throw new Error("Failed to generate case counter");
  }
};

module.exports = caseCounter;