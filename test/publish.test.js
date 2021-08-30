require('dotenv').config({path: '.test.env'})

const { MongoClient } = require('mongodb');
const request = require('supertest');
const app = require('../src/app');
const SubscriptionDao = require('../src/dao/subscription_dao');

describe('Topic Publishing', () => {
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

    const multipleSubscriberTopic = 'multipleSubscriberTopic';
    const oneSubscriberTopic = 'oneSubscriberTopic';
    const noSubscriberTopic = 'noSubscriberTopic';
    const validUrlOne = 'http://localhost:1234/test';
    const validUrlTwo = 'http://localhost:1234/test-two';
    const validUrlThree = 'http://localhost:1234/test-three';

    const sampleDataToPublish = {
        'key': 'Sample Data',
        'data': {
            'where': 'there',
            'in': [1, 2, 3]
        }
    };

    test('Invalid publish request [Invalid request body]', async () => {
        const response = await request(app)
            .post(`/publish/${multipleSubscriberTopic}`)
            .send([]);
        
        expect(response.statusCode).toEqual(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toEqual({error: 'Invalid request body.'});
    });

    test('Create subscription [New Topic]', async () => {
        const response = await request(app)
            .post(`/subscribe/${multipleSubscriberTopic}`)
            .send({
                url: validUrlOne
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('topic');
        expect(response.body).toHaveProperty('url');
        expect(response.body.topic).toEqual(multipleSubscriberTopic);
        expect(response.body.url).toEqual(validUrlOne);
    });

    test('Create subscription [Same Topic, new URL]', async () => {
        const response = await request(app)
            .post(`/subscribe/${multipleSubscriberTopic}`)
            .send({
                url: validUrlTwo
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('topic');
        expect(response.body).toHaveProperty('url');
        expect(response.body.topic).toEqual(multipleSubscriberTopic);
        expect(response.body.url).toEqual(validUrlTwo);
    });

    test('Create subscription [New Topic 2]', async () => {
        const response = await request(app)
            .post(`/subscribe/${oneSubscriberTopic}`)
            .send({
                url: validUrlThree
            });
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('topic');
        expect(response.body).toHaveProperty('url');
        expect(response.body.topic).toEqual(oneSubscriberTopic);
        expect(response.body.url).toEqual(validUrlThree);
    });

    test('Publish to topic with no subscribers', async () => {
        const response = await request(app)
            .post(`/publish/${noSubscriberTopic}`)
            .send(sampleDataToPublish);
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('data');
        expect(response.body.status).toEqual('Publish to 0 subscriber(s) completed!');
        expect(response.body.data).toEqual({topic: noSubscriberTopic, data: sampleDataToPublish});
    });

    test('Publish to topic with 1 subscriber', async () => {
        const response = await request(app)
            .post(`/publish/${oneSubscriberTopic}`)
            .send(sampleDataToPublish);
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('data');
        expect(response.body.status).toEqual('Publish to 1 subscriber(s) completed!');
        expect(response.body.data).toEqual({topic: oneSubscriberTopic, data: sampleDataToPublish});
    });

    test('Publish to topic with 2 subscribers', async () => {
        const response = await request(app)
            .post(`/publish/${multipleSubscriberTopic}`)
            .send(sampleDataToPublish);
        
        expect(response.statusCode).toEqual(200);
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('data');
        expect(response.body.status).toEqual('Publish to 2 subscriber(s) completed!');
        expect(response.body.data).toEqual({topic: multipleSubscriberTopic, data: sampleDataToPublish});
    });
});