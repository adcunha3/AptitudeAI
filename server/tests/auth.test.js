const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const dotenv = require('dotenv');

dotenv.config();

let mongooseConnection;

const newUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'securePassword123',
    roles: 'Customer'
};

const invalidUser = {
    username: 'testuser',
    password: 'wrongPassword'
};

const nonExistentUser = {
    username: 'nonexistentuser',
    password: 'somePassword'
};

beforeAll(async () => {
  const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@aptitudeai.okhen.mongodb.net/${process.env.MONGODB_TEST_DBNAME}`;
  mongooseConnection = await mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterEach(async () => {
  await User.deleteMany({}, mongooseConnection);
});

afterAll(async () => {
  await mongooseConnection.close();
});

describe('POST /api/auth/signup', () => {
    it('should create a new user and return a success message', async () => {
        const response = await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(201);

        expect(response.body).toHaveProperty('message', 'User was registered successfully.');
    });

    it('should return an error if the username is already taken', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(201);

        const response = await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(400);

        expect(response.body).toHaveProperty('message', 'Error: Username is already in use.');
    });
});

describe('POST /api/auth/signin', () => {
    it('an existing user can sign in and return their credentials', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(201);

        const existingUser = {
            username: 'testuser',
            password: 'securePassword123'
        };

        const response = await request(app)
            .post('/api/auth/signin')
            .send(existingUser)
            .expect(200);

        expect(response.body).toHaveProperty('username', existingUser.username);
        expect(response.body).toHaveProperty('token');
    });

    it('user is not found and return a 404', async () => {
        const response = await request(app)
            .post('/api/auth/signin')
            .send(nonExistentUser)
            .expect(404);

        expect(response.body).toHaveProperty('message', 'User Not found.');
    });

    it('invalid password and return a 401', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(201);

        const response = await request(app)
            .post('/api/auth/signin')
            .send(invalidUser)
            .expect(401);

        expect(response.body).toHaveProperty('message', 'Invalid Password.');
    });
});

describe('POST /api/auth/signout', () => {
    beforeAll(async () => {
        await request(app)
            .post('/api/auth/signup')
            .send(newUser)
            .expect(201);
    });

    it('an existing user can sign out and return status 200', async () => {
        const signinResponse = await request(app)
            .post('/api/auth/signin')
            .send(newUser)
            .expect(200);

        const token = signinResponse.body.token;

        const response = await request(app)
            .post('/api/auth/signout')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body).toHaveProperty('message', `User has been signed out.`);
    });
});
