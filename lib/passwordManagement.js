/**
 * Created by Andres Monroy (HyveMynd) on 1/14/15.
 */
var assert = require('assert');
var Promise = require('bluebird');
var User = require('../models/user');
var hat = require('hat');
var nodemailer = require('nodemailer');
var config = require('../config');
var LogConfig = require('../models/log');
var bcrypt = require('bcrypt-nodejs');

var PasswordManagement = function(db){
    var module = {};
    Promise.promisifyAll(db.users);

    var logger = new LogConfig({
        subject: "PasswordManager",
        db: db
    });

    var transporter = nodemailer.createTransport({
        service: config.service,
        auth: {
            user: config.email,
            pass: config.password
        }
    });

    var checkIfUserExists = function (email) {
        return new Promise(function (resolve, reject) {
            db.users.firstAsync({email: email}).then(function (user) {
                if (user){
                    return resolve(new User(user))
                } else {
                    return reject("User does not exist");
                }
            }, reject);
        });
    };

    var createPasswordReset = function (user) {
        return new Promise(function (resolve, reject) {
            var token = hat();
            user.resetToken = token;
            db.users.saveAsync(user).then(function (user) {
                return resolve(new User(user));
            }, reject);
        });
    };
    
    var emailPasswordReset = function (user) {
        return new Promise(function (resolve, reject) {
            var mailOptions = {
                from: config.email,
                to: user.email,
                subject: config.subject,
                text: config.body + config.link + user.resetToken
            };

            transporter.sendMail(mailOptions, function (err, info) {
                if (err){
                    return reject(err);
                }

                logger.info("Password reset requested. %j", info);
                return resolve(user);
            });
        });
    };

    /**
     * Request for a password reset with for the email given in args.
     * @param args
     * @returns {Promise}
     */
    module.sendForgotPasswordEmail = function (email) {
        return new Promise(function (resolve, reject) {
            if (!email) {
                return reject("Must have an email");
            }
            checkIfUserExists(email).then(createPasswordReset).then(emailPasswordReset).then(resolve, reject);
        });
    };

    var findUserByToken = function (args) {
        return new Promise(function (resolve, reject) {
            db.users.firstAsync({resetToken: args.token}).then(function (user) {
                if (!!user){
                    args.user = user;
                    return resolve(args);
                }
                return reject('Token is invalid.');
            }, reject);
        });
    };

    var createNewPassword = function (args) {
        return new Promise(function (resolve, reject) {
            bcrypt.hash(args.password, null, null, function (err, result) {
                assert.ok(err === null, err);
                args.user.hashedPassword = result;
                args.user.resetToken = null;
                db.users.save(args.user, function (err, newUser) {
                    assert.ok(err === null, err);
                    return resolve(args);
                });
            });
        });
    };

    /**
     * Reset the password for the user with the given token
     * @param token
     * @param password
     * @param confirm
     * @returns {Promise}
     */
    module.resetPassword = function (token, password, confirm) {
        return new Promise(function (resolve, reject) {
            if (password !== confirm){
                return reject("Passwords do not match")
            }
            var args = {};
            args.token = token;
            args.password = password;
            args.confirm = confirm;
            return findUserByToken(args).then(createNewPassword).then(function (args) {
                return resolve(args.user);
            }, reject);
        });
    };

    return module;
};

module.exports = PasswordManagement;