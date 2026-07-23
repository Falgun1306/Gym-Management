import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import dietService from "../services/diet.service.js";

const createDietPlan = asyncHandler(async (req, res) => {
    const dietPlan = await dietService.createDietPlan(req.user.id, req.body);
    res.status(201).json(new ApiResponse(201, dietPlan, "Diet plan created successfully"));
});

const getDietPlans = asyncHandler(async (req, res) => {
    const plans = await dietService.getDietPlans(req.user.id);
    res.status(200).json(new ApiResponse(200, plans));
});

const getDietPlanById = asyncHandler(async (req, res) => {
    const plan = await dietService.getDietPlanById(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, plan));
});

const updateDietPlan = asyncHandler(async (req, res) => {
    const updatedPlan = await dietService.updateDietPlan(req.user.id, req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedPlan, "Diet plan updated successfully"));
});

const deleteDietPlan = asyncHandler(async (req, res) => {
    await dietService.deleteDietPlan(req.user.id, req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Diet plan deleted successfully"));
});

const assignDietPlan = asyncHandler(async (req, res) => {
    const assignment = await dietService.assignDietPlan(req.user.id, req.params.planId, req.params.memberId);
    res.status(201).json(new ApiResponse(201, assignment, `Diet plan "${assignment.dietPlan?.title || "Plan"}" assigned to member successfully`));
});

const getMyDietPlans = asyncHandler(async (req, res) => {
    const plans = await dietService.getMyDietPlans(req.user.id);
    res.status(200).json(new ApiResponse(200, plans));
});

export {
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
    getMyDietPlans,
};
