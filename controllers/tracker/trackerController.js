const { Driver } = require("../../models");

// getDriverById
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
      attributes: ["id", "name", "phone", "email", "photo"],
    });

    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }

    return res.status(200).json({
      message: "Fetched successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res.status(500).json({
      error: "Failed to fetch driver",
    });
  }
};

//updateById
const updateDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, photo, email } = req.body;
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
    });
    if (!driver) {
      return res.status(404).json({
        error: "Driver not found",
      });
    }
    await driver.update({
      name: name ?? driver.name,
      phone: phone ?? driver.phone,
      email: email ?? driver.email,
      photo: photo ?? driver.photo,
    });

    return res.status(200).json({
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    console.error("Error updating driver:", error);
    return res.status(500).json({
      error: "Failed to update driver",
    });
  }
};

//deleteDriverById
const deleteDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({
      where: {
        id,
        trash: false,
      },
    });

    await Driver.update({ trash: true });
    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    console.log("Error in deleting driver: ", error);
  }
};
module.exports = { getDriverById, updateDriverById, deleteDriverById };
