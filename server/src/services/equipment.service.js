import equipmentRepository from "../repositories/equipment.repository.js";
import ErrorHandler from "../utility/ErrorHandler.utility.js";

class EquipmentService {
    async createEquipment(data) {
        const { name, category, quantity, status, purchaseDate, maintenanceDate, lastMaintenanceDate, lastMaintenance } = data;
        if (!name || !quantity) {
            throw new ErrorHandler("name and quantity are required", 400);
        }

        const existing = await equipmentRepository.findByName(name);
        if (existing) {
            throw new ErrorHandler("An equipment item with this name already exists", 409);
        }

        const itemStatus = (status === 'OPERATIONAL') ? 'AVAILABLE' : (status || 'AVAILABLE');
        const mDate = maintenanceDate || lastMaintenanceDate || lastMaintenance;

        return equipmentRepository.create({
            name,
            category: category || "General",
            quantity: parseInt(quantity),
            status: itemStatus,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            maintenanceDate: mDate ? new Date(mDate) : null,
        });
    }

    async listEquipment(query) {
        const { page = 1, limit = 20, search, category, status } = query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};

        if (search) {
            where.name = { contains: search, mode: "insensitive" };
        }

        if (category) {
            where.category = category;
        }

        if (status) {
            where.status = status;
        }

        const { data, total } = await equipmentRepository.findMany(where, skip, limitNum);

        return {
            equipment: data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        };
    }

    async getEquipmentById(id) {
        const equipment = await equipmentRepository.findById(id);
        if (!equipment) {
            throw new ErrorHandler("Equipment not found", 404);
        }
        return equipment;
    }

    async updateEquipment(id, body) {
        const existing = await equipmentRepository.findById(id);
        if (!existing) {
            throw new ErrorHandler("Equipment not found", 404);
        }

        const updateData = {};
        if (body.name !== undefined) {
            const nameCheck = await equipmentRepository.findByName(body.name);
            if (nameCheck && nameCheck.id !== id) {
                throw new ErrorHandler("An equipment with this name already exists", 409);
            }
            updateData.name = body.name;
        }

        if (body.category !== undefined) updateData.category = body.category || "General";
        if (body.quantity !== undefined) updateData.quantity = parseInt(body.quantity);
        if (body.status !== undefined) updateData.status = (body.status === 'OPERATIONAL') ? 'AVAILABLE' : body.status;
        if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
        
        const mDate = body.maintenanceDate || body.lastMaintenanceDate || body.lastMaintenance;
        if (mDate !== undefined) {
            updateData.maintenanceDate = mDate ? new Date(mDate) : null;
        }

        if (Object.keys(updateData).length === 0) {
            throw new ErrorHandler("No valid fields provided to update", 400);
        }

        return equipmentRepository.update(id, updateData);
    }

    async updateEquipmentStatus(id, status) {
        const existing = await equipmentRepository.findById(id);
        if (!existing) {
            throw new ErrorHandler("Equipment not found", 404);
        }

        const itemStatus = (status === 'OPERATIONAL') ? 'AVAILABLE' : status;
        return equipmentRepository.update(id, { status: itemStatus });
    }

    async deleteEquipment(id) {
        const existing = await equipmentRepository.findById(id);
        if (!existing) {
            throw new ErrorHandler("Equipment not found", 404);
        }

        return equipmentRepository.delete(id);
    }
}

export default new EquipmentService();
