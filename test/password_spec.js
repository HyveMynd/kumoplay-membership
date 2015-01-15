var assert = require("assert");
var User = require('../models/user');
var PasswordManagement = require('../lib/passwordManagement');
var Registration = require('../lib/registration');
var db = require('revision');
var should = require('should');

describe("Password Management", function () {
    var pm = {};
    var reg = {};
    before(function (done) {
        db.connect({db:"membership"}, function (err, db) {
            pm = new PasswordManagement(db);
            reg = new Registration(db);
            done();
        });
    });

    describe("request a reset", function () {
        var user = {};
        before(function(done){
            this.timeout(4000);
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "asd@dsa.com", password: "a", confirm: "a", firstName: 'asd', lastName: 'dsa'}, function (err, result) {
                    pm.sendForgotPasswordEmail(result.user.email).then(function (result) {
                        user = result;
                        done();
                    }).catch(function (err) {
                        user = null;
                        done();
                    }).done();
                });
            });
        });
        it("is successful", function(){
            should.exist(user);
        });
        it("creates a token", function () {
            should.exist(user.resetToken);
        });
    });

    describe("reset a password", function(){
        var oldpass = null;
        var newpass = null;
        before(function (done) {
            this.timeout(4000);
            db.users.destroyAll(function (err) {
                reg.applyForMembership({email : "asd@dsa.com", password: "a", confirm: "a", firstName: 'asd', lastName: 'dsa'}, function (err, result) {
                    pm.sendForgotPasswordEmail(result.user.email).then(function (user) {
                        oldpass = user.hashedPassword;
                        pm.resetPassword(user.resetToken, 'b', 'b').then(function (user) {
                            newpass = user.hashedPassword;
                            done();
                        }).done();
                    }).done();
                });
            });
        });

        it("is successful", function () {
            should.exist(newpass);
            should.exist(oldpass);
        });
        it("has a new password", function () {
            oldpass.should.not.equal(newpass);
        });

    });
});