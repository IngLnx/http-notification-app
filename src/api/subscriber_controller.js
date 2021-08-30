const SubscriptionDao = require('../../src/dao/subscription_dao');
const Util = require('../../src/utils/util');

class SubscriberController {
    static async subscribe(req, resp) {
        const { topic } = req.params;

        // Validate topic to make sure valid value was passed
        if (topic === undefined || !topic) {
            return resp.status(400).json({error: "Path parameter 'topic' undefined or blank"})
        }

        // Get request body
        let requestBody = req.body;
        if (!requestBody || Object.keys(requestBody).length < 1) {
            Util.log('Request body is blank or empty (with no keys)');
            return resp.status(400).json({error: 'Request body cannot be blank nor empty.'});
        }
        
        const url = requestBody.url;
        if (!url) {
            Util.log('URL in request body does not exist or is blank');
            return resp.status(400).json({error: 'URL cannot be blank.'});
        } else if (!Util.isValidHttpUrl(url)) {
            Util.log(`Value for parameter 'url' [${url}] is not a valid URL`);
            return resp.status(400).json({error: 'Invalid URL provided.'});
        }

        // Check if subscription with topic and url already exists
        // To avoid duplicate topic-url subscriptions
        let existingSubscription;
        try {
            existingSubscription = await SubscriptionDao.findSubscriptions(topic, url);
            Util.log(`Existing subscription: ${JSON.stringify(existingSubscription)}`);
        } catch (err) {
            Util.log(`Finding existing subscription failed. Error: ${err}`);
            return resp.status(500).json('Could not verify subscription.');
        }

        // If error in existingSubscription or data is undefined, return error response
        // If existingSubscription.data has at least 1 entry, return error - subscription already exists
        if (existingSubscription.error !== undefined
            || existingSubscription.data === undefined 
            || !Array.isArray(existingSubscription.data)) {
            Util.log('Finding existing subscription failed!');
            return resp.status(500).json('Could not verify subscription');
        } else if (existingSubscription.data.length !== 0) {
            Util.log(`Subscription for topic [${topic}] with URL [${url}] already exists`);
            return resp.json({error: 'Subscription already exists!'});
        }

        // Add subscription to db
        let newSubscription;
        try {
            newSubscription = await SubscriptionDao.addSubscription(topic, url);
        } catch (err) {
            Util.log('Subscription could not be stored in db');
            return resp.status(500).json({error: 'Subscription could not be created'});
        }

        // Adding subscription was not successful, and an error was returned
        if (newSubscription.error) {
            Util.log(`Adding subscription failed. Response: ${newSubscription}`);
            return resp.json({error: newSubscription.error});
        }

        resp.json({url: url, topic: topic});
    }
}

module.exports = SubscriberController;