const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database : 'chat'
  }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

// app.get('/', (req, res)=>{
// 	res.send(database.users);
// })

// signin
app.post('/signin', (req, res)=>{

	const {username, password} = req.body;

	return db.select('id', 'username', 'hash').from('users')
	.where('username', '=', username)
	.then(user=>{
		const isValid = bcrypt.compareSync(password, user[0].hash);
		if(isValid){
			res.json(user[0]);
		}else{
			res.status(400).json("Invalid login credentials");
		}
	})
	.catch(error=>res.status(400).json("Unable to login"));
	
})

//registration
app.post('/register', (req,res) => {

	const {username, password} = req.body;
	let hash = bcrypt.hashSync(password);

	return db('users')
	.returning('*')
	.insert({
		username: username,
		hash: hash,
		joined: new Date()
	})
	.then(user=>{
		res.json(user[0]);
	})
	.catch(err=> res.status(400).json("Unable to register"));
})

//GET user 
// app.get('/profile/:id', (req, res)=>{

// 	const {id} = req.params;
	
// 	return db.select('*').from('users')
// 	.where({id:id})
// 	.then(user => {
// 		if(user.length){
// 			res.json(user[0]);	
// 		}else{
// 			res.status(400).json("No such user")
// 		}
		
// 	})
// 	.catch(err=>res.status(400).json("Error getting user"));

// })


//GET messages from the database
app.get('/messages',(req,res)=>{

	return db('messages').orderBy('timestamp', 'desc')
    .join('users', 'users.id', 'messages.user_id')
    .select('users.username as username', 'messages.id', 'messages.user_id', 'messages.message', 'messages.timestamp')
	.then(messages => {
		res.json(messages);	
	})
	.catch(err=>res.status(400).json("Error getting messages"));
	
})

//GET messages liked from the database
app.get('/messages-liked/:id',(req,res)=>{

	const {id} = req.params;

	if(id===undefined){
		return res.status(400).json("No likes yet");
	}

	return db.select('message_id').from('likes')
	.where('user_id', '=', id)
	.then(likes => {
		res.json(likes);	
	})
	.catch(err=>res.status(400).json("Error getting likes"));

})


//POST new message into the database
app.post('/message',(req,res)=>{
	
	const {id, message} = req.body;

	db('messages')
	.returning('*')
	.insert({
		user_id: id,
		message: message,
		timestamp: new Date()
	})
	.then(message=>{
		res.json(message[0]);
	})
	.catch(err=> res.status(400).json("Unable to post the message"));

})

//POST message liked
app.post('/message-like',(req,res)=>{

	const {mid, uid} = req.body;

	db('likes')
	.insert({
		user_id: uid,
		message_id: mid
	})
	.then(response=>{
		res.json("Message liked!");
	})
	.catch(err=> res.status(400).json("Unable to like the message"));

})

app.listen(process.env.PORT || 3000,()=>{
	console.log("App is running on port ${process.env.PORT}");
});