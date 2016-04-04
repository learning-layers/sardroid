// Environment files are injected with a gulp task
window.env = {
    rollbar : {
        token       : '@@ROLLBAR_TOKEN',
        environment : '@@ROLLBAR_ENV'
    },
    turnServer : {
        username : '@@TURN_USERNAME',
        password : '@@TURN_PASSWORD'
    },
    environment : '@@ENVIRONMENT',
    version     : '@@VERSION'
};

