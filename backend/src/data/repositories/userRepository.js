const { getDB } = require('../../db/connect');

class UserRepository {
    async findByEmail(email) {
        const db = getDB();
        return await db.collection('User').findOne({ Email: email });
    }

    async findByEmailAndPassword(email, password) {
        const db = getDB();
        return await db.collection('User').findOne({ 
            Email: email,
            Password: password
        });
    }

    async create(userData) {
        const db = getDB();
        const result = await db.collection('User').insertOne(userData);
        return { ...userData, _id: result.insertedId };
    }

    async update(userId, updateData) {
        const db = getDB();
        const result = await db.collection('User').updateOne(
            { userID: userId },
            { $set: updateData }
        );
        return result.modifiedCount > 0;
    }
}

module.exports = new UserRepository();