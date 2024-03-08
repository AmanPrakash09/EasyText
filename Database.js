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
   				// Ping the dbName to ensure it exists
   				return client.db(dbName).command({ ping: 1 });
  			})
			.then(() => {
  	 			console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
   				resolve(client.db(dbName));
  			})
  			.catch((err) => {
  	 			reject(err);
 		 	});
	});
 	this.status = () => this.connected.then(
  		db => ({ error: null, url: mongoUrl, db: dbName }),
  		err => ({ error: err })
 	);
}

// TASK 2 PART A
Database.prototype.getRooms = function() {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            const collection = db.collection('chatrooms');
            collection.find({}).toArray().then(rooms => {
                resolve(rooms);
            }).catch(error => {
                console.error('Error retrieving rooms:', error);
                reject(error); // Resolve with an empty array in case of an error
            });
        })
    );
}

// TASK 2 PART D
Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			// const ObjectId = require('mongodb').ObjectId;
            // let id;

            // try {
            //     if (room_id instanceof ObjectId) {
            //         id = room_id;
            //     } else {
            //         id = new ObjectId(room_id);
            //     }

            //     db.collection('chatrooms').findOne({ _id: id }, (err, room) => {
            //         if (err) {
            //             reject(err);
            //         } else {
            //             resolve(room);
            //         }
            //     });
            // } catch (error) {
            //     reject(error);
            // }
			if (db) {
				resolve(db.collection('chatrooms').findOne({ _id: room_id }));
			} else {
				reject(err);
			}
		})
	)
}


Database.prototype.addRoom = function(room){
    if (!room.name) {
        return Promise.reject(new Error("Room name is required"));
    }

    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection('chatrooms').insertOne(room)
            .then(result => {
                db.collection('chatrooms').findOne({ _id: result.insertedId })
                .then(newRoom => {
                    resolve(newRoom); // Return the newly added room as it is in the database
                }).catch(findError => {
                    reject(findError);
                });
            }).catch(insertError => {
                reject(insertError);
            });
        })
    );
};


Database.prototype.addRoom = function(room){
    if (!room.name) {
        return Promise.reject(new Error("Room name is required"));
    }

    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection('chatrooms').insertOne(room)
            .then(result => {
                // Use the insertedId to fetch the newly added room
                const newRoomId = result.insertedId;
                db.collection('chatrooms').findOne({ _id: newRoomId })
                .then(newRoom => {
                    resolve(newRoom); // Return the newly added room
                }).catch(err => {
                    reject(err);
                });
            }).catch(err => {
                reject(err);
            });
        })
    );
};

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
		})
	)
}

Database.prototype.addConversation = function(conversation){
    if (!conversation.room_id || !conversation.timestamp || !conversation.messages) {
        return Promise.reject(new Error("Missing required fields in conversation object"));
    }

    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection('conversations').insertOne(conversation)
            .then(result => {
                db.collection('conversations').findOne({ _id: result.insertedId })
                .then(newConversation => {
                    resolve(newConversation);
                }).catch(findError => {
                    reject(findError);
                });
            }).catch(insertError => {
                reject(insertError);
            });
        })
    );
};

Database.prototype.getLastConversation = function(room_id, before = Date.now()){
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            db.collection('conversations').find({ room_id: room_id, timestamp: { $lt: before } })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray()
            .then(result => {
                resolve(result[0] || null);
            }).catch(error => {
                reject(error);
            });
        })
    );
};

module.exports = Database;