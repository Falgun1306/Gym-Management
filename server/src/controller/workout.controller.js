import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import workoutService from "../services/workout.service.js";

const createWorkoutPlan = asyncHandler(async (req, res) => {
    const workoutPlan = await workoutService.createWorkoutPlan(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, workoutPlan, "Workout plan created successfully"));
});

const getWorkoutPlans = asyncHandler(async (req, res) => {
    const plans = await workoutService.getWorkoutPlans(req.user.id);
    res.status(200).json(new ApiResponse(200, plans));
});

const getWorkoutPlanById = asyncHandler(async (req, res) => {
    const plan = await workoutService.getWorkoutPlanById(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, plan));
});

const updateWorkoutPlan = asyncHandler(async (req, res) => {
    const updatedPlan = await workoutService.updateWorkoutPlan(req.user.id, req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedPlan, "Workout plan updated successfully"));
});

const deleteWorkoutPlan = asyncHandler(async (req, res) => {
    await workoutService.deleteWorkoutPlan(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Workout plan deleted successfully"));
});

const assignWorkoutPlan = asyncHandler(async (req, res) => {
    const result = await workoutService.assignWorkoutPlan(req.user.id, req.params.planId, req.params.memberId);
    res.status(201).json(new ApiResponse(201, { assignedExercises: result.assignedCount }, `Workout plan "${result.title}" assigned to member successfully`));
});

const getMyWorkoutPlans = asyncHandler(async (req, res) => {
    const plans = await workoutService.getMyWorkoutPlans(req.user.id);
    res.status(200).json(new ApiResponse(200, plans));
});

export {
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
    getMyWorkoutPlans,
};
