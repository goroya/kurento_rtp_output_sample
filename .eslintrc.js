module.exports = {
    "extends": "google",
    "plugins": ["node", "babel"],
    "parser": "babel-eslint",
    "env": {
        "es6": true,
        "node": true
    },
    "parserOptions": {
        "ecmaVersion": 2017,
        "sourceType": "module",
        "ecmaFeatures": {
        }
    },
    "rules": {
        "key-spacing": "off",
        "require-jsdoc": "off"
    }
};
