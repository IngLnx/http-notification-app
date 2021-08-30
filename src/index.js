const app = require('./app');
const subscriptionDao = require('../src/dao/subscription_dao');
const { MongoClient } = require('mongodb');

const APP_PORT = process.env.APP_PORT || 4000;

MongoClient.connect(
    process.env.APP_DB_URI, 
    {useNewUrlParser: true}, 
    async function(error, client) {
        if (error) {
            console.error(error.stack);
            process.exit(1);
        }

        // Inject MongoDB connection into data access objects (DAOs)
        await subscriptionDao.injectDb(client);

        // Start application on port
        app.listen(APP_PORT, function() {
            console.log(`App started. Listening on port ${APP_PORT}`);
        });
    });