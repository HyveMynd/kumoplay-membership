/**
 * Created by HyveMynd on 7/20/14.
 */
var User = require("../models/user");
var Application = require("../models/application");
var assert = require('assert');
var bcrypt = require('bcrypt-nodejs');
var LogConfig = require('../models/log');
var Emitter = require('events').EventEmitter;
var util = require('util');

var RegResult = function(){
    return {
        success: false,
        message: null,
        user: null
    };
};

var Registration  = function (db) {
    Emitter.call(this);
    var self = this;
    var continueWith = null;
    var logger = new LogConfig({
        subject: "Registration",
        db: db
    });


    var validateInputs = function(app){
        // make sure email and pass are there
        if(!app.email || !app.password){
            app.invalidate("Email and password are required");
            self.emit("invalidated", app);
        } else if (app.password !== app.confirm) {
            app.invalidate("Passwords do not match");
            self.emit("invalidated", app);
        } else if (!app.firstName || !app.lastName) {
            app.invalidate("Must include a first and last name");
            self.emit("invalidated", app);
        } else {
            app.validate();
            self.emit("validated", app);
        }
    };

    var checkIfUserExists = function (app) {
        db.users.exists({email: app.email}, function (err, exists) {
            assert.ok(err === null, err);

            if (exists){
                app.invalidate("This email already exists");
                self.emit("invalidated", app);
            } else {
                self.emit("user-does-not-exist", app);
            }
        });
    };

    var createUser = function (app) {
        var user = new User(app);
        user.signInCount = 1;
        user.status = "approved";
        bcrypt.hash(app.password, null, null, function (err, result) {
            assert.ok(err === null, err);
            user.hashedPassword = result;
            db.users.save(user, function (err, newUser) {
                assert.ok(err === null, err);
                app.user = newUser;
                self.emit('user-created', app);
            });
        });
    };

    var addLogEntry = function (app) {
        logger.info("Successfully registered user. Application: %j", app);
        self.emit('log-created', app);
    };


    var registrationOk = function (app) {
        var regResult = new RegResult();
        regResult.success = true;
        regResult.message = "Welcome";
        regResult.user = app.user;
        self.emit('registered', app);
        if (continueWith){
            continueWith(null, regResult);
        }
    };

    var registrationFailed = function (app) {
        var regResult = new RegResult();
        regResult.success = false;
        regResult.message = app.message;
        self.emit('not-registered', app);
        if (continueWith){
            continueWith(null, regResult);
        }
    };

    self.applyForMembership = function(args, next){
        var app = new Application(args);
        continueWith = next;
        self.emit('application-started', app);
    };

    // Normal Path
    self.on('application-started', validateInputs);
    self.on('validated', checkIfUserExists);
    self.on('user-does-not-exist', createUser);
    self.on('user-created', addLogEntry);
    self.on('log-created', registrationOk);

    // Error path
    self.on('invalidated', registrationFailed);

    return self;
};

util.inherits(Registration, Emitter);
module.exports = Registration;
