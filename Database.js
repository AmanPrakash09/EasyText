const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		const client = new MongoClient(mongoUrl);

		client.connect()
		.then(() => {
			console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
			resolve(client.db(dbName));
		}, reject);
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

// TASK 2 PART A
Database.prototype.getRooms = function(){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			this.db.collection('chatrooms').find().toArray((err, rooms) => {
				if (err) {
					reject(err);
				} else {
					resolve(rooms);
				}
			});
		})
	)
}

// TASK 2 PART D
Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			const ObjectID = require('mongodb').ObjectID;
            let id;

            try {
                if (room_id instanceof ObjectID) {
                    id = room_id;
                } else {
                    id = new ObjectID(room_id);
                }

                db.collection('chatrooms').findOne({ _id: id }, (err, room) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(room);
                    }
                });
            } catch (error) {
                reject(error);
            }
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
		})
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
		})
	)
}

module.exports = Database;