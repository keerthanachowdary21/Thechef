## Description

This is a backend application built using **Node.js** and **SQLite** for managing users and posts for a simple Instagram-like application. The backend provides RESTful APIs to create, read, update, and delete posts and users, as well as managing the post count for users.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript (ES6)

## Features

1. **User Model**: Stores user details such as name, mobile number, address, and post count.
2. **Post Model**: Stores post details such as title, description, user ID, and images (JSON Array of strings).
3. **REST APIs**:
    - Get all posts for a user.
    - Create a post for a user.
    - Edit a post for a user.
    - Delete a post for a user.
    - Get all users.
    - Get all posts.
    - Create and delete users.

## Setup Instructions

### Prerequisites

- **Node.js** installed on your system.
- **SQLite** (No additional setup required as the database is managed via SQLite3).

### Access the following endpoints:

`GET /posts/:`userId: Get all posts for a user.

`POST /posts/:` Create a new post for a user.

`PUT /posts/:`postId: Edit an existing post.

`DELETE /posts/:`postId: Delete a post.

`GET /users/: `Get all users.

`POST /users/: `Create a new user.

`DELETE /users/:`userId: Delete a user and their associated posts.
## Database Initialization

- The database is initialized automatically when the server starts, and it creates the necessary tables for Users and Posts. It also inserts dummy data for users and posts.
