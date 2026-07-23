import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import exerciseService from "../services/exercise.service.js";

const createExercise = asyncHandler(async (req, res) => {
    const exercise = await exerciseService.createExercise(req.body);
    res.status(201).json(new ApiResponse(201, exercise, "Exercise created successfully"));
});

const listExercises = asyncHandler(async (req, res) => {
    const exercises = await exerciseService.listExercises(req.query);
    res.status(200).json(new ApiResponse(200, exercises));
});

const searchExercises = asyncHandler(async (req, res) => {
    const exercises = await exerciseService.searchExercises(req.query.q);
    res.status(200).json(new ApiResponse(200, exercises));
});

const getExercisesByMuscleGroup = asyncHandler(async (req, res) => {
    const exercises = await exerciseService.getExercisesByMuscleGroup(req.params.muscleGroup);
    res.status(200).json(new ApiResponse(200, exercises));
});

const getExerciseById = asyncHandler(async (req, res) => {
    const exercise = await exerciseService.getExerciseById(req.params.id);
    res.status(200).json(new ApiResponse(200, exercise));
});

const updateExercise = asyncHandler(async (req, res) => {
    const updatedExercise = await exerciseService.updateExercise(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedExercise, "Exercise updated successfully"));
});

const deleteExercise = asyncHandler(async (req, res) => {
    await exerciseService.deleteExercise(req.params.id);
    res.status(200).json(new ApiResponse(200, null, "Exercise deleted successfully"));
});

export {
    createExercise,
    listExercises,
    searchExercises,
    getExercisesByMuscleGroup,
    getExerciseById,
    updateExercise,
    deleteExercise,
};
