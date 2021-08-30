const async = require('async');
const SubscriptionDao = require('../../src/dao/subscription_dao');
const Util = require('../../src/utils/util');

class PublisherController {
    static async publish(req, resp) {
        const { topic } = req.params;

        // Validate topic to make sure valid value was passed
        if (topic === undefined || !topic) {
            return resp.status(400).json({error: "Path parameter 'topic' undefined or blank"})
        }

        // Validate that request body is a JavaScript object {}
        let requestBody = req.body;
        if (requestBody == null || typeof requestBody !== 'object' || requestBody.constructor !== Object) {
            Util.log(`Request body is blank or not a valid object: ${JSON.stringify(requestBody)}`);
            return resp.status(400).json({error: 'Invalid request body.'});
        }

        // Get subsciptions to topic
        let subscriptions;
        try {
            subscriptions = await SubscriptionDao.findSubscriptions(topic);
        } catch (err) {
            Util.log(`Failed to fetch subscriptions for topic. Error: ${err}`);
            return resp.status(500).json({error: 'Failed to fetch subscribers'});
        }

        // Check if error wasn't returned from Dao
        if (subscriptions.error !== undefined
            || subscriptions.data === undefined 
            || !Array.isArray(subscriptions.data)) {
            Util.log('Finding subscriptions to publish to failed!');
            return resp.status(500).json('Finding subscribers to publish to failed!');
        }

        // Use async to send requests to subscribers URL(s), if any
        let data = {topic: topic, data: requestBody};
        let subscriberUrlDetails = subscriptions.data.map(s => ({url: s.url, body: data}));
        async.map(subscriberUrlDetails, Util.doHttpPost, function(err, response) {
            if (err) {
                Util.log(`Error occurred while posting requests. Error: ${err}`);
            } else {
                Util.log(`Got response: ${response}`);
            }
        });

        resp.json({
            status: `Publish to ${subscriberUrlDetails.length} subscriber(s) completed!`,
            data: data
        });
    }
}

module.exports = PublisherController;