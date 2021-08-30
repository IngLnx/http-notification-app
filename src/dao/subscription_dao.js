const { ObjectId } = require('bson');
const Util = require('../../src/utils/util');

let collection;

class SubscriptionDao {
    /**
     * Make connection available to module
     * @param {Db} connection - MongoDB db connection
     */
    static async injectDb(connection) {
        if (collection) {
            return;
        }

        try {
            collection = await connection.db(process.env.APP_DB_NAME).collection('subscription');
        } catch (err) {
            console.error(`Unable to get 'subscription' collection. Error: ${err}`)
        }
    }

    /**
     * Create a subscription
     * @param {string} topic - Topic to subscribe to
     * @param {string} url - URL to notify on publish
     * @returns {DaoResponse} Return data or error based on result of operation
     */
    static async addSubscription(topic, url) {
        if (!topic || !url) {
            Util.log(`Topic and/or URL is/are blank or undefined`);
            return {error: 'Invalid values for argument(s): topic and/or url'};
        }
        try {
            let now = new Date();
            let insertResult = await collection.insertOne(
                {topic: topic, url: url, createdAt: now, updatedAt: now}
            );
            let data = await collection.findOne({_id: ObjectId(insertResult.insertedId)});
            return { data: data }
        } catch (err) {
            console.error(`Could not add subscription. Error: ${err}`);
            return { error: e }
        }
    }

    /**
     * Find subscriptions (by topic and/or url; both optional)
     * @param {string} [topic] - Topic to find
     * @param {string} [url] - URL to find
     * @returns {DaoResponse} - Return data (list of subscriptions) or error
     */
    static async findSubscriptions(topic, url) {
        // Build query based on parameters passed
        let query = {};
        if (topic !== undefined) {
            query.topic = topic;
        }
        if (url !== undefined) {
            query.url = url;
        }

        let itemsMatched;
        try {
            Util.log(`Find subscriptions query: ${JSON.stringify(query)}`);
            itemsMatched = await collection.find(query).toArray();
        } catch (err) {
            console.error(`Could not find subscriptions using query ${query}. Error: ${err}`);
            return { error: err }
        }

        return { data: itemsMatched};
    }
}

/**
 * Subscription document
 * @typedef Subscription
 * @property {string} _id
 * @property {string} topic
 * @property {string} url
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * DAO response
 * @typedef DaoResponse
 * @property {Object} [data] - Data returned
 * @property {string} [error] - Error message
 */

module.exports = SubscriptionDao;