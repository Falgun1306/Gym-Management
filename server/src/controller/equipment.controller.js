import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import equipmentService from "../services/equipment.service.js";

const createEquipment = asyncHandler(async (req, res) => {
    const equipment = await equipmentService.createEquipment(req.body);
    res.status(201).json(new ApiResponse(201, equipment, "Equipment added successfully"));
});

const listEquipment = asyncHandler(async (req, res) => {
    const { equipment, pagination } = await equipmentService.listEquipment(req.query);
    res.status(200).json(new ApiResponse(200, equipment, "Equipment retrieved successfully", pagination));
});

const getEquipmentById = asyncHandler(async (req, res) => {
    const equipment = await equipmentService.getEquipmentById(req.params.id);
    res.status(200).json(new ApiResponse(200, equipment));
});

const updateEquipment = asyncHandler(async (req, res) => {
    const equipment = await equipmentService.updateEquipment(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, equipment, "Equipment updated successfully"));
});

const updateEquipmentStatus = asyncHandler(async (req, res) => {
    const equipment = await equipmentService.updateEquipmentStatus(req.params.id, req.body.status);
    res.status(200).json(new ApiResponse(200, equipment, `Equipment status updated to ${req.body.status}`));
});

const deleteEquipment = asyncHandler(async (req, res) => {
    await equipmentService.deleteEquipment(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Equipment deleted successfully"));
});

export {
    createEquipment,
    listEquipment,
    getEquipmentById,
    updateEquipment,
    updateEquipmentStatus,
    deleteEquipment,
};
