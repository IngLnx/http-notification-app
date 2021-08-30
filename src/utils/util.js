const got = require('got');

class Util {
    /**
     * Log a message to the console, only when APP_MODE is not test
     * @param {any} message - Message to log
     */
    static log(message) {
        if (process.env.APP_MODE !== 'test') console.log(message);
    }

    /**
     * Check if a string matches a valid URL
     * @param {string} urlString - String to test
     * @returns {boolean} Whether string matches a valid URL or not
     */
    static isValidHttpUrl(urlString) {
        if (!urlString) return false;

        let url;
        try {
            url = new URL(urlString);
        } catch (err) {
            Util.log(`Could not parse [${urlString}] as URL. Error: ${err}`);
            return false;
        }

        // Check if protocol is HTTP or HTTPS
        return url.protocol === 'http:' || url.protocol === 'https:';
    }

    /**
     * Make an HTTP POST request
     * @param {Object} param0 - Object containing URL and body to send to URL
     * @returns {any | null} Response body, and null in case of error
     */
    static async doHttpPost({url, body}) {
        try {
            Util.log(`Sending ${JSON.stringify(body)} to ${url}`);
            const response = await got.post(url, {json: body});
            return response.body;
        } catch (err) {
            Util.log(`Error sending HTTP POST request. Error: ${err}`);
            return null;
        }
    }
}

module.exports = Util;