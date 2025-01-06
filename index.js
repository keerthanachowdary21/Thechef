const express = require('express')
const path = require('path')
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'database.db')
const app = express()
app.use(express.json())

let db = null

//User's Data
const dummy_users=[
  {
    "name": "Jwala",
    "mobile_number": 909999999,
    "address": "Goa",
    "post_count": 1
},
{
    "name": "Isha",
    "mobile_number": 9898989898,
    "address": "New delhi",
    "post_count": 4
},
{
    "name": "Simmo",
    "mobile_number": 7878787878,
    "address": "Ap",
    "post_count": 2
},
{
    "name": "Nisha",
    "mobile_number": 2345678919,
    "address": "Bangalore",
    "post_count": 2
}
]
//posts
const dummy_posts=[
  {
      "title": "First Post",
      "description": "This is My First Post",
      "images": JSON.stringify(["postimage1.jpg", "postimage1.jpg"]),
      "user_id": 1,
  },
  {
      "title": "Second Post",
      "description": "This is My Second Post",
      "images": JSON.stringify(["postimage3.jpg"]),
      "user_id": 2,
  },
  {
     "title": "Third Post",
      "description": "This is My Third Post",
      "images": JSON.stringify(["postimage7.jpg"]),
      "user_id": 2,
  },
  {
      "title": "Fourth Post",
      "description": "This is My Fourth Post",
      "images": JSON.stringify(["postimage10.jpg"]),
      "user_id": 4,
  },
  {
      "title": "Fifth Post",
      "description": "This is My Fifth Post",
      "images": JSON.stringify([]),
      "user_id": 4,
  }
]

const initializeDBAndServer = async () => {
  try {
    // To Open the SQLite database in try catch block to deal with any errors
    db = await open({ filename: dbPath, driver: sqlite3.Database })
    
    // Creating  tables of Users and Posts only if they don't exist in database
    await db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY,
        name VARCHAR(256),
        mobile_number INTEGER UNIQUE,
        address TEXT,
        post_count INTEGER DEFAULT 0
      );
    `);
    
    await db.run(`
      CREATE TABLE IF NOT EXISTS Posts (
        id INTEGER PRIMARY KEY,
        title TEXT,
        description TEXT,
        images JSON,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES  Users(id)
      );
    `);


    //Insert Users into a Users Table using for loop cant use map function because get db.run error cant use.
    for (const eachUser  of dummy_users) {
      const existingUserQuery = `SELECT * FROM Users WHERE mobile_number = ?`;
      const existingUser  = await db.get(existingUserQuery, [eachUser .mobile_number]);
      if (!existingUser){
        await db.run(`
          INSERT INTO Users(name,mobile_number,address,post_count) 
          VALUES (?,?,?,?);
          `,[eachUser.name,eachUser.mobile_number,eachUser.address,eachUser.post_count]
        );
      }
    }

    await db.run(`DELETE FROM Posts`)
    //Inserting dummy posts for future operation purposes
    for (const eachPost of dummy_posts){
      await db.run(`
        INSERT INTO Posts(title,description,images,user_id) 
        VALUES (?,?,?,?);
        `,[eachPost.title,eachPost.description,eachPost.images,eachPost.user_id])
    }

    // Start the server once the DB initialization is complete
    app.listen( process.env.PORT || 3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1) //is a method that terminates the Node.js process.
  }
}

// Initialize the database and start the server
initializeDBAndServer()


// GET ALL POSTS OF A PARTICULAR USER----->1
app.get('/posts/:userId',async (request, response)=>{
  const {userId}=request.params
  const getUserPostsDataQuery=`SELECT * FROM Posts where user_id = '${userId}'`
  const userPostsDataArray=await db.all(getUserPostsDataQuery)
  response.send(userPostsDataArray)
})

// CREATE A POST FOR A USER--------->2
app.post("/posts/",async (request,response)=>{
  const {title,description,images,userId}=request.body
  try{
    const createPostQuery=`
        INSERT INTO Posts(title,description,images,user_id) 
        VALUES ('${title}','${description}','${JSON.stringify(images)}','${userId}');
        `
    const dbResponse=await db.run(createPostQuery)
    if (dbResponse.changes===1){
      await db.run(`UPDATE Users SET post_count = post_count + 1 WHERE id = '${request.body.userId}'`);
      response.send(`POST CREATED SUCCESSFULLY with id: ${dbResponse.lastID}`)
    }
  }catch(err){
    response.status(500).send(err.message)
  }

  
})

// EDIT A POST OF A USER------>3
app.put("/posts/:postId",async (request,response)=>{
    const {postId}=request.params
    console.log(postId)
    const {title,description,images}=request.body
    const getPostQuery=await db.get(`SELECT * FROM Posts WHERE id = '${postId}'`)
    try{
      const editPostQuery=`
      UPDATE Posts SET 
      title = '${title}', 
      description = '${description}', 
      images = '${JSON.stringify(images)}'
      WHERE id = '${postId}';
      `
      const dbResponse=await db.run(editPostQuery)
      if (dbResponse.changes===0 && getPostQuery===undefined){
        response.send("Post Not Found")
      }else{
        if (dbResponse.changes===1){
          response.send("Post Changed Successfully")
        }
      }
    }catch(err){
      response.status(500).send(err.message)
    }
  })

// DELETE A POST----->4
app.delete('/posts/:postId', async (request, response) => {
  const { postId } = request.params;
  try{
    
  const userId=await db.get(`SELECT user_id from Posts WHERE id = '${postId}'`)
  const deletePostQuery = `DELETE FROM Posts WHERE id = '${postId}'`;
  const dbResponse=await db.run(deletePostQuery)
  if (dbResponse.changes===1 && userId !== undefined){
    await db.run(`UPDATE Users SET post_count = post_count - 1 WHERE id = '${userId.user_id}'`);
    response.send("Post Deleted Successfully")
  }
  else{
    if (dbResponse.changes===0) {
      response.send("Post Not Found")
    }
  }
  }catch (err){
    response.status(500).send(err.message)
  }

})


// GET ALL USERS---->5
app.get('/users/',async (request, response)=>{
  const getUsersDataQuery=`SELECT * FROM Users`
  const usersData=await db.all(getUsersDataQuery)
  response.send(usersData)
})

// GET ALL POSTS--->6
app.get('/posts/',async (request, response)=>{
  const getPostsDataQuery=`SELECT * FROM Posts`
  const postsDataArray=await db.all(getPostsDataQuery)
  response.send(postsDataArray)
})


//Extra CREATE A USER
app.post('/users/',async (request,response)=>{
  const {name,mobile_number,address,post_count}=request.body
  const existingUserQuery = `SELECT * FROM Users WHERE mobile_number = ?`;
  const existingUser  = await db.get(existingUserQuery, [request.body.mobile_number]);
  if (!existingUser){
    const insertUserDataQuery=`
      INSERT INTO Users(name,mobile_number,address,post_count) VALUES('${name}','${mobile_number}','${address}','${post_count}')  
  `
  const dbResponse=await db.run(insertUserDataQuery,function(err) {
      if (err) reject(err);
  })
  const id = dbResponse.lastID
  response.send(`User Data Inserted with id: ${id}`)
  }else{
    response.send("DB ERROR:Mobile Number is already Exist in the table")
  }
  
})

//Extra DELETE A USER
app.delete('/users/:userId', async (request, response) => {
  const { userId } = request.params;
  try {
    // Check if the user exists
    const userExistsQuery = `SELECT * FROM Users WHERE id = ?`;
    const user = await db.get(userExistsQuery, [userId]);

    if (user) {
      // Delete the user's posts
      const deletePostsQuery = `DELETE FROM Posts WHERE user_id = ?`;
      await db.run(deletePostsQuery, [userId]);

      // Delete the user
      const deleteUserQuery = `DELETE FROM Users WHERE id = ?`;
      await db.run(deleteUserQuery, [userId]);

      response.send("User and associated posts deleted successfully");
    } else {
      response.status(404).send("User not found");
    }
  } catch (err) {
    response.status(500).send(err.message);
  }
});


app.get('/', (req, res) => {
    res.send('Welcome')
  })
