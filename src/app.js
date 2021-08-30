const express = require('express');
const SubscriberController = require('../src/api/subscriber_controller');
const PublisherController = require('../src/api/publisher_controller');

const app = express();

// Include JSON parser
app.use(express.json());

// Register API base routes
app.post('/subscribe/:topic', SubscriberController.subscribe);
app.post('/publish/:topic', PublisherController.publish);
// This is a route meant to be used as template for subscriber urls
app.post('/subscribers/:tag', (req, resp) => resp.json({tag: req.params.tag, data: req.body}));
app.use('*', (req, resp) => resp.status(404).json({error: 'Not Found!'}));

module.exports = app;