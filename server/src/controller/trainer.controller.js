import asyncHandler from "../middlewares/asyncHandler.middleware.js";
import ApiResponse from "../utility/ApiResponse.utility.js";
import trainerService from "../services/trainer.service.js";

import {
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
} from "./workout.controller.js";

import {
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
} from "./diet.controller.js";

import {
    listExercises,
    searchExercises,
    updateExercise,
    deleteExercise,
} from "./exercise.controller.js";

import {
    getMemberAttendance,
    markMemberAttendance,
} from "./attendance.controller.js";

import {
    getClassBookings,
} from "./gymClass.controller.js";

const getMyProfile = asyncHandler(async (req, res) => {
    const trainer = await trainerService.getMyProfile(req.user.id);
    res.status(200).json(new ApiResponse(200, trainer));
});

const updateMyProfile = asyncHandler(async (req, res) => {
    const updatedTrainer = await trainerService.updateMyProfile(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, updatedTrainer, "Profile updated successfully"));
});

const listTrainers = asyncHandler(async (req, res) => {
    const trainers = await trainerService.listTrainers(req.query);
    res.status(200).json(new ApiResponse(200, trainers));
});

const getTrainerById = asyncHandler(async (req, res) => {
    const trainer = await trainerService.getTrainerById(req.params.id);
    res.status(200).json(new ApiResponse(200, trainer));
});

const getMyMembers = asyncHandler(async (req, res) => {
    const members = await trainerService.getMyMembers(req.user.id);
    res.status(200).json(new ApiResponse(200, members));
});

const getMyMemberById = asyncHandler(async (req, res) => {
    const member = await trainerService.getMyMemberById(req.user.id, req.params.memberId);
    res.status(200).json(new ApiResponse(200, member));
});

const getMySchedule = asyncHandler(async (req, res) => {
    const schedule = await trainerService.getMySchedule(req.user.id);
    res.status(200).json(new ApiResponse(200, schedule));
});

const updateMySchedule = asyncHandler(async (req, res) => {
    const updatedSchedule = await trainerService.updateMySchedule(req.user.id, req.body.slots);
    res.status(200).json(new ApiResponse(200, updatedSchedule, "Schedule updated successfully"));
});

const logMemberProgress = asyncHandler(async (req, res) => {
    const progressLog = await trainerService.logMemberProgress(req.user.id, req.params.memberId, req.body);
    res.status(201).json(new ApiResponse(201, progressLog, "Progress logged successfully"));
});

const getMemberProgress = asyncHandler(async (req, res) => {
    const progressLogs = await trainerService.getMemberProgress(req.user.id, req.params.memberId);
    res.status(200).json(new ApiResponse(200, progressLogs));
});

export {
    getMyProfile,
    updateMyProfile,
    listTrainers,
    getTrainerById,
    getMyMembers,
    getMyMemberById,
    createWorkoutPlan,
    getWorkoutPlans,
    getWorkoutPlanById,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    assignWorkoutPlan,
    createDietPlan,
    getDietPlans,
    getDietPlanById,
    updateDietPlan,
    deleteDietPlan,
    assignDietPlan,
    getMySchedule,
    updateMySchedule,
    logMemberProgress,
    getMemberProgress,
    getMemberAttendance,
    markMemberAttendance,
    listExercises,
    searchExercises,
    updateExercise,
    deleteExercise,
    getClassBookings,
};
