/**
 * Created by HyveMynd on 7/20/14.
 */
var events = require('events');
var util = require('util');
var Registration = require('./lib/registration');
var Authentication = require('./lib/authentication');
var db = require('revision');
var assert = require('assert');
var PasswordManagement = require('./lib/passwordManagement');
var Promise = require('bluebird');

var Membership = function(dbName) {
    var self = this;
    events.EventEmitter.call(self);

    self.findByUserToken = function (token, next) {
        db.connect({db:dbName}, function (err, db) {
            assert.ok(err === null, err);
            db.users.first({authenticationToken: token}, next);
        });
    };

    self.authenticate = function (email, password, next) {
        db.connect({db: dbName}, function (err, db) {
            assert.ok(err === null, err);
            var auth = new Authentication(db);

            auth.on('authenticated', function (authResult) {
                self.emit('authenticated', authResult);
            });
            auth.on('not-authenticated', function (authResult) {
                self.emit('authenticated', authResult);
            });

            auth.authenticate({email: email, password: password}, next);
        });
    };
    
    self.register = function (email, password, confirm, firstName, lastName, next) {
        db.connect({db: dbName}, function (err, db) {
            assert.ok(err === null, err);
            var reg = new Registration(db);

            reg.on('registered', function (app) {
                self.emit('registered', app);
            });
            reg.on('not-registered', function (app) {
                self.emit('not-registered', app);
            });

            reg.applyForMembership({
                email: email,
                password: password,
                confirm: confirm,
                firstName: firstName,
                lastName: lastName
            }, next);
        });
    };

    self.forgotPassword = function (email) {
        return new Promise(function (resolve, reject) {
            db.connect({db: dbName}, function (err, db) {
                assert.ok(err === null, err);
                var pm = new PasswordManagement(db);
                pm.sendForgotPasswordEmail(email).then(function () {
                    return resolve();
                }).catch(function (err) {
                    console.log(err.message);
                    return reject(err);
                }, reject);
            });
        });
    };

    self.resetPassword = function (token, password, confirm) {
        return new Promise(function (resolve, reject) {
            db.connect({db:dbName}, function (err, db) {
                assert.ok(err === null, err);
                var pm = new PasswordManagement(db);
                pm.resetPassword(token, password, confirm).then(function (user) {
                    return resolve();
                }).catch(function (err) {
                    console.log(err.message);
                    return reject(err);
                }, reject);
            })
        });
    };

    return self;
};

util.inherits(Membership, events.EventEmitter);
module.exports = Membership;