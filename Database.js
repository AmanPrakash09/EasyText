const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our app.
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

Database.prototype.getRooms = function() {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            const collection = db.collection('chatrooms');
            collection.find({}).toArray().then(rooms => {
                resolve(rooms);
            }).catch(error => {
                console.error('Error retrieving rooms:', error);
                reject(error);
            });
        })
    );
}

Database.prototype.getRoom = function(room_id){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			if (db) {
				resolve(db.collection('chatrooms').findOne({ _id: room_id }));
			} else {
				reject(err);
			}
		})
	)
}

Database.prototype.addRoom = function(room){
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            if (db) {
                if (!room.name) {
                    reject(new Error('Name field is required for a new room'));
                } else {
                    const newRoomId = `room-${this.getNextRoomId()}`;
                    room._id = room._id || newRoomId;
                    db.collection('chatrooms').insertOne(room).then(result => {
                        resolve(room);
                    }).catch(err => {
                        reject(err);
                    });
                }
            } else {
                reject(new Error('Database not connected'));
            }
        })
    );
};

Database.prototype.getNextRoomId = function() {
    return this.connected.then(db => 
        db.collection('chatrooms').find({})
            .sort({ _id: -1 })
            .limit(1)
            .toArray()
            .then(rooms => {
                if (rooms.length > 0) {
                    const lastRoomId = rooms[0]._id;
                    const match = lastRoomId.match(/room-(\d+)/);
                    if (match && match[1]) {
                        return `room-${parseInt(match[1]) + 1}`;
                    }
                }
                return 'room-1';
            })
    );
};

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
                    console.log(newConversation);
                    resolve(newConversation);
                }).catch(findError => {
                    console.error(findError);
                    reject(findError);
                });
            }).catch(insertError => {
                console.error(insertError);
                reject(insertError);
            });
        })
    );
};

Database.prototype.getLastConversation = function(room_id, before = Date.now()){
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            console.log("YOOOOOOOOOOOOOOOOOOOOOOO: " + room_id);
            db.collection('conversations').find({ room_id: room_id.toString(), timestamp: { $lt: before } })
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

Database.prototype.getUser = function(username) {
    console.log(`getUser called with username: ${username}`);
    return this.connected.then(db => {
        console.log('Connected to database, querying for user');
        return db.collection('users').findOne({ username: username })
            .then(user => {
                console.log(`User found: ${user}`);
                return user;
            })
            .catch(err => {
                console.error('Error fetching user:', err);
                throw err;
            });
    });
};

// getting all users of the app
Database.prototype.getUsers = function() {
    return this.connected.then(db => 
        db.collection('users').find({}).project({ password: 0 }).toArray()
    );
};

Database.prototype.getLatestMessages = function(room_id, limit) {
    return this.connected.then(db =>
        new Promise((resolve, reject) => {
            // sort all timestamp by descending value
            db.collection('conversations')
                .find({ room_id: room_id.toString() })
                .sort({ timestamp: -1 })
                .toArray()
                .then(conversations => {
                    let messages = [];
                    // iterate over the conversations
                    for (let conversation of conversations) {
                        // add messages until enough
                        messages = messages.concat(conversation.messages.slice(-limit));
                        if (messages.length >= limit) {
                            break;
                        }
                    }
                    // throw some away if over limit
                    if (messages.length > limit) {
                        messages = messages.slice(0, limit);
                    }
                    
                    resolve(messages.reverse());
                })
                .catch(error => {
                    reject(error);
                });
        })
    );
};

module.exports = Database;