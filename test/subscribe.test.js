require('dotenv').config({path: '.test.env'})

const { MongoClient } = require('mongodb');
const request = require('supertest');
const app = require('../src/app');
const SubscriptionDao = require('../src/dao/subscription_dao');

describe('Topic Subscription', () => {
    beforeAll(async () => {
        process.env.APP_MODE = 'test'
        this.dbClient = await MongoClient.connect(process.env.APP_DB_URI, {useNewUrlParser: true});
        await SubscriptionDao.injectDb(this.dbClient);
    });

    afterAll(async () => {
        try {
            await this.dbClient.db().dropDatabase();
            await this.dbClient.close();
        } catch (err) {
            throw err;
        }
    });

    const testTopicName = 'sameRandomTopic';
    const validUrlOne = 'http://localhost:1234/test';
    const validUrlTwo = 'http://localhost:1234/test-two';
    
    test('Invalid subscription request [Empty body]', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({});
        
        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toEqual({error: 'Request body cannot be blank nor empty.'});
    });

    test('Invalid subscription request [Blank URL]', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({
                url: ''
            });
        
        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toEqual({error: 'URL cannot be blank.'});
    });

    test('Invalid subscription request [Invalid URL]', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({
                url: 'someStringThatIsNotAString'
            });
        
        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toEqual({error: 'Invalid URL provided.'});
    });

    test('Create subscription [New Topic]', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({
                url: validUrlOne
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('topic');
        expect(response.body).toHaveProperty('url');
        expect(response.body.topic).toEqual(testTopicName);
        expect(response.body.url).toEqual(validUrlOne);
    });

    test('Add existing subscription', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({
                url: validUrlOne
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toEqual({error: 'Subscription already exists!'});
    });

    test('Create subscription [Same Topic, new URL]', async () => {
        const response = await request(app)
            .post(`/subscribe/${testTopicName}`)
            .send({
                url: validUrlTwo
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('topic');
        expect(response.body).toHaveProperty('url');
        expect(response.body.topic).toEqual(testTopicName);
        expect(response.body.url).toEqual(validUrlTwo);
    });
});